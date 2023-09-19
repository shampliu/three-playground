import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Pane } from "tweakpane";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { HalftonePass } from "three/addons/postprocessing/HalftonePass.js";

import { FilmGrainShader } from "@/lib/shaders/postprocessing/FilmGrainShader";

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
  bloomPass,
  filmGrainPass;

const UNIFORMS = {
  backgroundColor: 0xffae70,

  uTime: {
    value: 0,
  },

  uLight1: {
    value: new THREE.Vector3(0, 200, 0),
  },

  // bloom
  exposure: 0.8,
  bloomStrength: 0.2,
  bloomThreshold: 0,
  bloomRadius: 0,
};

export const initPointCloudScene = async (container) => {
  pane = new Pane();
  clock = new THREE.Clock();

  camera = new THREE.PerspectiveCamera(
    80,
    window.innerWidth / window.innerHeight,
    0.01,
    10000
  );

  camera.position.set(0, 8, 5);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(UNIFORMS.backgroundColor);

  renderer = new THREE.WebGLRenderer({
    logarithmicDepthBuffer: true,
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const params = {
    shape: 1,
    radius: 4,
    rotateR: Math.PI / 12,
    rotateB: (Math.PI / 12) * 2,
    rotateG: (Math.PI / 12) * 3,
    scatter: 0,
    blending: 1,
    blendingMode: 1,
    greyscale: false,
    disable: false,
  };
  const halftonePass = new HalftonePass(
    window.innerWidth,
    window.innerHeight,
    params
  );
  composer.addPass(halftonePass);

  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85
  );
  bloomPass.threshold = UNIFORMS.bloomThreshold;
  bloomPass.strength = UNIFORMS.bloomStrength;
  bloomPass.radius = UNIFORMS.bloomRadius;
  composer.addPass(bloomPass);

  filmGrainPass = new ShaderPass(FilmGrainShader);
  composer.addPass(filmGrainPass);

  // LIGHTING
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // 0.2
  scene.add(ambientLight);

  const light = new THREE.SpotLight();
  light.position.set(20, 20, 20);
  scene.add(light);

  orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.enableDamping = true;

  container.appendChild(renderer.domElement);

  // handleResize();
  // window.addEventListener("resize", handleResize, false);

  // initGUI();

  await initObjects();

  update();
};

const initObjects = async () => {
  loader = new GLTFLoader();
  // loader = new PLYLoader();

  // const material = new THREE.MeshPhysicalMaterial({
  //   color: 0xb2ffc8,
  //   // envMap: envTexture,
  //   metalness: 0,
  //   roughness: 0,
  //   transparent: true,
  //   transmission: 1.0,
  //   side: THREE.DoubleSide,
  //   clearcoat: 1.0,
  //   clearcoatRoughness: 0.25,
  // });
  const material = new THREE.MeshBasicMaterial({ color: "red" });

  loader.load("models/ash.glb", (gltf) => {
    gltf.scene.traverse((o) => {
      if (o.isMesh) {
        console.log(o.material);

        // o.material = new THREE.PointsMaterial({ color: "red" });
        const size = o.geometry.attributes.position.count;
        const aSize = new Float32Array(size);
        const aSpeed = new Float32Array(size);
        const aLife = new Float32Array(size);

        for (let i = 0; i < size; i++) {
          aSize[i] = Math.random() * 0.4 + 0.8;

          aSpeed[i] = Math.random();

          aLife[i] = Math.random() * 1 + 1;
        }

        o.geometry.setAttribute("aSize", new THREE.BufferAttribute(aSize, 1));
        o.geometry.setAttribute("aSpeed", new THREE.BufferAttribute(aSpeed, 1));
        o.geometry.setAttribute("aLife", new THREE.BufferAttribute(aLife, 1));

        o.material = new THREE.ShaderMaterial({
          uniforms: {
            uTime: UNIFORMS.uTime,
            uLight1: UNIFORMS.uLight1,
          },
          transparent: true,
          vertexShader: `
            attribute float aLife;
            attribute float aSize;
            attribute float aSpeed;

            uniform float uTime;

            uniform vec3 uLight1;

            varying vec3 vColor;
            varying vec3 vNormal;

            void main() {
              float progress = (mod(uTime, aLife) / aLife);
              gl_PointSize = (4. + aSize * 6.) * (1. - progress);

              vec3 pos = position;
              pos.y += progress * .2;

              vec4 worldPos = modelMatrix * vec4(pos, 1.0);

              // lights

              
              
              vec3 uLight2 = vec3(0.0, 200., 20.0);
              vec3 uLight3 = vec3(20.0, 200., 0.0);
              vec3 uLight4 = vec3(20.0, 200., 20.0);

              float maxLightDist = 10000.0;
              float falloff1 = 1.0 - clamp(distance(worldPos.xyz, uLight1), 0.0, maxLightDist) / maxLightDist;
              falloff1 = pow(falloff1, 3.0);
              vec3 color1 = vec3(0.05, 0.15, 0.1);

              float falloff2 = 1.0 - clamp(distance(worldPos.xyz, uLight2), 0.0, maxLightDist) / maxLightDist;
              falloff2 = pow(falloff2, 3.0);
              vec3 color2 = vec3(0.55, 0.12, 0.01);
              float falloff3 = 1.0 - clamp(distance(worldPos.xyz, uLight3), 0.0, maxLightDist) / maxLightDist;
              falloff3 = pow(falloff3, 3.0);
              vec3 color3 = vec3(0.1, 0.2, 0.1);
              float falloff4 = 1.0 - clamp(distance(worldPos.xyz, uLight4), 0.0, maxLightDist) / maxLightDist;
              falloff4 = pow(falloff4, 8.0);
              vec3 color4 = vec3(0.1, 0.3, 0.5);

              vec3 color = vec3(0.0);
              color += color1 * falloff1 * .5;
              color += color2 * falloff2 * .5;
              color += color3 * falloff3 * .4;
              color += color4 * falloff4 * .4;

              vNormal = (modelMatrix * vec4(normal, 0.)).xyz;
              float d = max(dot(vNormal, uLight1), 0.0);


              vColor = d * color;

              gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
          `,
          fragmentShader: `
            uniform float uTime;

            varying vec3 vColor;

            void main() {
              vec2 uv = gl_PointCoord.xy;
              float a = 1.0 - length(uv - 0.5);
              if (a < 0.5) discard;

              vec3 color = vColor;
              color.x += sin(uTime) * 0.1;

              gl_FragColor = vec4(color, a);
            }
          `,
        });

        const p = new THREE.Points(o.geometry, o.material);
        p.scale.setScalar(10);

        scene.add(p);
      }
    });
    scene.add(gltf.scene);

    console.log(gltf);
  });

  const test = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshBasicMaterial({ color: "red" })
  );

  // scene.add(test);
};

const update = () => {
  const delta = clock.getDelta();

  UNIFORMS.uTime.value += delta;

  orbitControls.update();

  // renderer.render(scene, camera);
  composer.render(delta);

  requestAnimationFrame(update);
};
