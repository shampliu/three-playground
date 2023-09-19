import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Pane } from "tweakpane";

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

const UNIFORMS = {
  backgroundColor: 0xffae70,
};

export const intPointCloudScene = async (container) => {
  pane = new Pane();
  clock = new THREE.Clock();

  camera = new THREE.PerspectiveCamera(
    80,
    window.innerWidth / window.innerHeight,
    0.01,
    10000
  );

  camera.position.set(0, 8, 120);

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
  loader = new GLTFLoader();

  const test = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshBasicMaterial({ color: "red" })
  );

  scene.add(test);
};

const update = () => {
  const delta = clock.getDelta();

  orbitControls.update();

  renderer.render(scene, camera);

  requestAnimationFrame(update);
};
