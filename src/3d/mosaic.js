import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Pane } from "tweakpane";
import { RAF } from "./lib/RAF";

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

  // textures: Array.from({ length: })
};

export const initMosaicScene = async (container) => {
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

  RAF.init();
  RAF.subscribe("main", update);
};

const initObjects = async () => {
  loader = new GLTFLoader();

  const video = document.createElement("video");
  video.muted = true;
  video.autoplay = true;
  video.crossOrigin = "anonymous";
  video.src = "https://oframe.github.io/ogl/examples/assets/laputa.mp4";
  video.play();
  video.loop = true;

  const t = new THREE.VideoTexture(video);
  window.t = t;

  const planeWidth = 10;
  const planeHeight = 10;
  const numCols = 3;
  const numRows = 3;
  const numPlanes = 9;

  const group = new THREE.Group();
  const p = new THREE.Vector3();
  for (let i = 0; i < numPlanes; i++) {
    const r = Math.floor(i / numRows); // 0
    const c = i % numCols; // 0

    p.x = (c - numCols / 2) * planeWidth;
    p.y = (r - numRows / 2) * planeHeight;

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(planeWidth, planeHeight),
      new THREE.MeshBasicMaterial({ map: t })
    );

    plane.position.copy(p);

    group.add(plane);
  }

  scene.add(group);
};

const update = () => {
  const delta = clock.getDelta();

  orbitControls.update();

  renderer.render(scene, camera);
};
