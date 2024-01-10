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
  fog,
  frameDelta = 0;

let ctx, canvas, canvasTexture, video;

const FPS = 24;
const INTERVAL = 1 / FPS;
const NUM_PLANES = 9;

const UNIFORMS = {
  backgroundColor: 0xffae70,

  textures: null,
};

console.log(UNIFORMS.textures);

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

  video = document.createElement("video");
  video.muted = true;
  video.autoplay = true;
  video.crossOrigin = "anonymous";
  // video.src = "https://oframe.github.io/ogl/examples/assets/laputa.mp4";
  video.src = "/laputa.mp4";
  video.play();
  video.loop = true;

  // init texture uniforms here because requires document object
  UNIFORMS.textures = Array.from({ length: NUM_PLANES })
    .fill(0)
    .map(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;

      return {
        ctx: canvas.getContext("2d"),
        value: new THREE.CanvasTexture(canvas),
      };
    });

  const planeWidth = 10;
  const planeHeight = 10;
  const numCols = 3;
  const numRows = 3;

  const group = new THREE.Group();
  const p = new THREE.Vector3();
  for (let i = 0; i < NUM_PLANES; i++) {
    const r = Math.floor(i / numRows); // 0
    const c = i % numCols; // 0

    p.x = (c - numCols / 2) * planeWidth;
    p.y = (r - numRows / 2) * -planeHeight;

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(planeWidth, planeHeight),
      new THREE.MeshBasicMaterial({ map: UNIFORMS.textures[i].value })
    );

    plane.position.copy(p);

    group.add(plane);
  }

  scene.add(group);
};

const update = () => {
  frameDelta += clock.getDelta();
  if (frameDelta > INTERVAL) {
    frameDelta = frameDelta % INTERVAL;

    updateVideo();
  }

  orbitControls.update();

  renderer.render(scene, camera);
};

const updateVideo = () => {
  const { ctx, value: canvasTexture } = UNIFORMS.textures[0];
  const canvas = ctx.canvas;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  canvasTexture.needsUpdate = true;

  for (let i = NUM_PLANES - 1; i >= 0; i--) {
    const { ctx, value: canvasTexture } = UNIFORMS.textures[i];
    const canvas = ctx.canvas;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (i === 0) {
      // non-delayed
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.drawImage(UNIFORMS.textures[i - 1].ctx.canvas, 0, 0);
    }

    canvasTexture.needsUpdate = true;
  }
};
