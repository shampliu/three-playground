import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Pane } from "tweakpane";

import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { ASCIIShader } from "@/lib/shaders/postprocessing/ASCIIShader";
import { RAF } from "./lib/RAF";

let renderer,
  camera,
  cameraParent,
  clock,
  player,
  orbitControls,
  mixer,
  loader,
  pane,
  textureLoader,
  fog;

const UNIFORMS = {
  backgroundColor: 0xffae70,

  uASCIISize: { value: 8 },

  uResolution: { value: new THREE.Vector2() },
  uNumCharacters: { value: 4 },
  uDimensions: { value: new THREE.Vector2() },
};

let scene1, scene2, composer1;

export const initVisualizerScene = async (container) => {
  pane = new Pane();
  clock = new THREE.Clock();

  camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    0.01,
    10000
  );

  camera.position.set(0, 8, 20);

  renderer = new THREE.WebGLRenderer({
    logarithmicDepthBuffer: true,
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);

  scene1 = new THREE.Scene();
  scene1.background = new THREE.Color(UNIFORMS.backgroundColor);

  scene2 = new THREE.Scene();
  scene2.background = new THREE.Color("yellow");

  composer1 = new EffectComposer(renderer);
  composer1.addPass(new RenderPass(scene1, camera));

  const textureLoader = new THREE.TextureLoader();
  const tChar1 = await textureLoader.loadAsync("/msdf/plus.png");
  // tChar1.wrapS = tChar1.wrapT = THREE.RepeatWrapping;

  // anisotropy: 0,
  // minFilter: this.gl.LINEAR,
  // magFilter: this.gl.LINEAR,
  // generateMipmaps: true,

  const ASCIIPass = new ShaderPass(ASCIIShader);
  ASCIIPass.uniforms.uResolution = UNIFORMS.uResolution;
  ASCIIPass.uniforms.uASCIISize = UNIFORMS.uASCIISize;
  ASCIIPass.uniforms.uNumCharacters = UNIFORMS.uNumCharacters;
  ASCIIPass.uniforms.tFont.value = createFontTexture();
  composer1.addPass(ASCIIPass);

  // LIGHTING
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // 0.2
  scene1.add(ambientLight);

  const sun = new THREE.DirectionalLight(0xffffff, 1);
  scene1.add(sun);

  orbitControls = new OrbitControls(camera, renderer.domElement);

  container.appendChild(renderer.domElement);

  handleResize();
  window.addEventListener("resize", handleResize, false);

  initGUI();

  await initObjects();

  RAF.init();
  RAF.subscribe("main", update);
};

// TODO: maybe move this into a class like RAF
const handleResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  UNIFORMS.uResolution.value.set(window.innerWidth, window.innerHeight);
};

const initObjects = async () => {
  loader = new GLTFLoader();

  // const test = new THREE.Mesh(
  //   new THREE.BoxGeometry(),
  //   new THREE.MeshBasicMaterial({ color: "red" })
  // );

  const model = await loader.loadAsync(
    "https://threejs.org/examples/models/gltf/Soldier.glb"
  );
  model.scene.scale.set(5, 5, 5);

  scene1.add(model.scene);
};

const initGUI = () => {
  pane.addBinding(UNIFORMS.uASCIISize, "value", {
    min: 1,
    max: 32,
    step: 1,
    label: "ASCII Size",
  });

  pane.addBinding(UNIFORMS.uNumCharacters, "value", {
    min: 1,
    max: 10,
    label: "Num Characters",
  });
};

const update = () => {
  const delta = clock.getDelta();

  orbitControls.update();

  // scene1.position.z = scene1.position.z + 0.01;

  if (scene1.position.z >= 5) {
    scene1.position.z = 0;
  }

  // renderer.render(scene1, camera);
  composer1.render(delta);
};

// TODO: refactor?
const createFontTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;

  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = texture.magFilter = THREE.NearestFilter;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  const fontSize = 50;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${fontSize}px monospace`;
  const charactersArray = " *,  #SF".split("");
  UNIFORMS.uNumCharacters.value = charactersArray.length;

  const cols = 16;
  const rows = 16;

  UNIFORMS.uDimensions.value.set(cols, rows);

  const cellHeight = canvas.height / rows;
  const cellWidth = canvas.width / cols;

  charactersArray.forEach((character, i) => {
    const x = i % cols;
    const y = Math.floor(i / rows);

    ctx.fillStyle = "white";
    ctx.fillText(
      character,
      x * cellWidth + cellWidth / 2,
      y * cellHeight + cellHeight / 2
    );
  });

  texture.needsUpdate = true;

  return texture;
};
