import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";
import { Pane } from "tweakpane";
import vertexShader from "./shaders/instancedSampleVertex.glsl";
import fragmentShader from "./shaders/instancedSampleFragment.glsl";
import { createInstancedGeometryForSkin } from "./util/createSkinnedMeshSurfaceSampler";

// pp
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { RadialBlurShader } from "@/lib/shaders/postprocessing/RadialBlurShader";
import {
  COMPOSITE_SHADER_UNIFORMS,
  CompositeShader,
} from "@/lib/shaders/postprocessing/CompositeShader";

let scene,
  renderer,
  camera,
  cameraParent,
  clock,
  composer,
  player,
  orbitControls,
  mixer,
  loader,
  pane,
  textureLoader,
  fog;

let compositePass, bloomPass, radialBlurPass;

const UNIFORMS = {
  backgroundColor: 0xffae70,

  uTime: { value: 0 },
  uRadialStrength: { value: 1 },
  uColor: { value: new THREE.Color("#f0a5d4") },

  // bloom
  bloomStrength: 0.2,
  bloomThreshold: 0,
  bloomRadius: 0,
};

export const initSkinnedSamplerScene = async (container) => {
  pane = new Pane();
  clock = new THREE.Clock();

  camera = new THREE.PerspectiveCamera(
    120,
    window.innerWidth / window.innerHeight,
    0.001,
    100
  );

  camera.position.set(0, 0, 4);

  renderer = new THREE.WebGLRenderer({
    logarithmicDepthBuffer: true,
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);

  scene = new THREE.Scene();
  // scene.background = new THREE.Color(UNIFORMS.backgroundColor);

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  radialBlurPass = new ShaderPass(RadialBlurShader);
  radialBlurPass.uniforms.uTime = UNIFORMS.uTime;
  radialBlurPass.uniforms.uRadialStrength = UNIFORMS.uRadialStrength;
  composer.addPass(radialBlurPass);

  compositePass = new ShaderPass(CompositeShader);
  compositePass.uniforms.uTime = UNIFORMS.uTime;
  composer.addPass(compositePass);

  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.5,
    0.85
  );
  bloomPass.threshold = UNIFORMS.bloomThreshold;
  bloomPass.strength = UNIFORMS.bloomStrength;
  bloomPass.radius = UNIFORMS.bloomRadius;
  composer.addPass(bloomPass);

  // LIGHTING
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // 0.2
  scene.add(ambientLight);

  orbitControls = new OrbitControls(camera, renderer.domElement);

  container.appendChild(renderer.domElement);

  // handleResize();
  // window.addEventListener("resize", handleResize, false);

  // initGUI();

  await initObjects();

  update();
};

const initObjects = async () => {
  loader = new GLTFLoader();

  const test = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshBasicMaterial({ color: "red" })
  );

  const textureLoader = new THREE.TextureLoader();
  const tex = textureLoader.load("textures/cube.jpg");
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  scene.background = tex;

  const gltf = await loader.loadAsync("models/drunk_run.glb");
  const petalGltf = await loader.loadAsync("models/petal.glb");
  const sampleGeometry = petalGltf.scene.getObjectByName("Plane").geometry;
  // const sampleGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  sampleGeometry.scale(0.1, 0.1, 0.1);
  sampleGeometry.computeVertexNormals(true); // smooth shading

  mixer = new THREE.AnimationMixer(gltf.scene);

  const action = mixer.clipAction(gltf.animations[0]);
  action.setEffectiveWeight(1);
  action.play();

  gltf.scene.traverse((o) => {
    if (o.isMesh && o instanceof THREE.SkinnedMesh) {
      const count = 5000;
      // const sampleGeometry = new THREE.SphereGeometry(0.02, 6, 6);
      createInstancedGeometryForSkin(o, count, sampleGeometry);

      const iAxis = new Float32Array(count * 3);
      const iSpeed = new Float32Array(count);
      const iSize = new Float32Array(count);
      const iLife = new Float32Array(count);

      const axis = new THREE.Vector3();
      for (let i = 0; i < count; i++) {
        axis
          .set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
          .normalize();
        axis.toArray(iAxis, i * 3);

        iSpeed[i] = Math.random() * 0.5 + 0.5;
        iSize[i] = Math.random() * 0.5 + 0.5;
        iLife[i] = Math.random() * 2 + 2; // seconds
      }

      sampleGeometry.setAttribute(
        "iAxis",
        new THREE.InstancedBufferAttribute(iAxis, 3)
      );
      sampleGeometry.setAttribute(
        "iSpeed",
        new THREE.InstancedBufferAttribute(iSpeed, 1)
      );
      sampleGeometry.setAttribute(
        "iSize",
        new THREE.InstancedBufferAttribute(iSize, 1)
      );
      sampleGeometry.setAttribute(
        "iLife",
        new THREE.InstancedBufferAttribute(iLife, 1)
      );

      console.log(sampleGeometry);

      o.material.opacity = 0;
      o.material.depthWrite = false;
      o.material.depthTest = false;
      o.material.transparent = true;

      o.skeleton.computeBoneTexture();

      const sampleMaterial = new THREE.RawShaderMaterial({
        uniforms: {
          bindMatrix: {
            value: o.bindMatrix,
          },
          bindMatrixInverse: {
            value: o.bindMatrixInverse,
          },
          boneTexture: {
            value: o.skeleton.boneTexture,
          },
          boneTextureSize: {
            value: o.skeleton.boneTextureSize,
          },
          uTime: UNIFORMS.uTime,
          uColor: UNIFORMS.uColor,
        },
        vertexShader,
        fragmentShader,
        side: THREE.DoubleSide,
        transparent: true,
      });

      const mesh = new THREE.InstancedMesh(
        sampleGeometry,
        sampleMaterial,
        count
      );

      scene.add(mesh);
    }
  });

  const group = new THREE.Group();
  // scene.add(gltf.scene);
  group.add(gltf.scene);
  group.scale.setScalar(1);

  scene.add(group);
  // scene.add(test);
};

const update = () => {
  const delta = clock.getDelta();

  UNIFORMS.uTime.value += delta;

  mixer.update(delta);

  orbitControls.update();

  // renderer.render(scene, camera);
  composer.render(delta);

  requestAnimationFrame(update);
};
