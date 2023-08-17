import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { GPUComputationRenderer } from "three/examples/jsm/misc/GPUComputationRenderer";
import { Pane } from "tweakpane";
import vertexShader from "./shaders/sampleVertex.glsl";
import fragmentShader from "./shaders/sampleFragment.glsl";
import { createPointsGeometryForSkin } from "./util/createSkinnedMeshSurfaceSampler";

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

export const GPURendererScene = async (container) => {
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

const initObjects = async () => {
  // GPU Compute

  gpuCompute = new GPUComputationRenderer(
    vertexStore.mapWidth,
    vertexStore.mapHeight,
    renderer
  );

  loader = new GLTFLoader();

  const test = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshBasicMaterial({ color: "red" })
  );

  const gltf = await loader.loadAsync("models/carla.glb");
  console.log(gltf);

  mixer = new THREE.AnimationMixer(gltf.scene);

  const action = mixer.clipAction(gltf.animations[0]);
  action.setEffectiveWeight(1);
  action.play();

  // gltf.scene.traverse((o) => {
  //   if (o.isMesh) {
  //     console.log(o);

  //     const sampleGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  //     const sampleMaterial = new THREE.MeshBasicMaterial({ color: "yellow " });

  //     const sampler = new MeshSurfaceSampler(o)
  //       .setWeightAttribute("color")
  //       .build();

  //     const mesh = new THREE.InstancedMesh(sampleGeometry, sampleMaterial, 100);

  //     const position = new THREE.Vector3();
  //     const matrix = new THREE.Matrix4();

  //     // Sample randomly from the surface, creating an instance of the sample
  //     // geometry at each sample point.
  //     for (let i = 0; i < 100; i++) {
  //       sampler.sample(position);

  //       matrix.makeTranslation(position.x, position.y, position.z);

  //       mesh.setMatrixAt(i, matrix);
  //     }

  //     scene.add(mesh);
  //   }
  // });

  gltf.scene.traverse((o) => {
    if (o.isMesh) {
      console.log(o.skeleton);

      const sampleGeometry = createPointsGeometryForSkin(o, 5000);
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

  mixer.update(delta);

  orbitControls.update();

  renderer.render(scene, camera);

  requestAnimationFrame(update);
};
