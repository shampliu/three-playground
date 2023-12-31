import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { GPUComputationRenderer } from "three/examples/jsm/misc/GPUComputationRenderer";
import { Pane } from "tweakpane";
import vertexShader from "./shaders/sampleVertex.glsl";
import fragmentShader from "./shaders/sampleFragment.glsl";
import { createPointsGeometryForSkin } from "./util/createSkinnedMeshSurfaceSampler";
import { createVertexStore } from "./util/gpgpu";

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
  fog,
  gpuCompute;

const UNIFORMS = {
  backgroundColor: 0xffae70,
};

export const initGPURendererScene = async (container) => {
  pane = new Pane();
  clock = new THREE.Clock();

  camera = new THREE.PerspectiveCamera(
    80,
    window.innerWidth / window.innerHeight,
    0.01,
    10000
  );

  camera.position.set(0, 8, 30);

  renderer = new THREE.WebGLRenderer({
    logarithmicDepthBuffer: true,
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(UNIFORMS.backgroundColor);

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

const initGPGPU = (sampleGeometry, mesh) => {
  // GPU Compute
  const colorMap = new THREE.Texture();

  const vertexStore = createVertexStore(sampleGeometry, colorMap);
  gpuCompute = new GPUComputationRenderer(
    vertexStore.mapWidth,
    vertexStore.mapHeight,
    renderer
  );

  mesh.material = vertexStore.material;
  mesh.geometry = vertexStore.geometry;
};

const initObjects = async () => {
  loader = new GLTFLoader();

  const gltf = await loader.loadAsync("models/carla.glb");
  console.log(gltf);

  mixer = new THREE.AnimationMixer(gltf.scene);

  const action = mixer.clipAction(gltf.animations[0]);
  action.setEffectiveWeight(1);
  action.play();

  gltf.scene.traverse((o) => {
    if (o instanceof THREE.SkinnedMesh) {
      console.log(o.skeleton);

      const sampleGeometry = createPointsGeometryForSkin(o, 5000);
      initGPGPU(sampleGeometry, o);
      // const sampleMaterial = new THREE.PointsMaterial({
      //   color: "white",
      //   size: 0.5,
      // });

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
        },
        vertexShader,
        fragmentShader,
      });

      const mesh = new THREE.Points(sampleGeometry, sampleMaterial);

      console.log(sampleMaterial.uniforms);

      scene.add(mesh);
    }
  });

  scene.add(gltf.scene);
  // scene.add(test);
};

const update = () => {
  const delta = clock.getDelta();

  mixer.update(delta * 0.04);

  orbitControls.update();

  renderer.render(scene, camera);

  requestAnimationFrame(update);
};
