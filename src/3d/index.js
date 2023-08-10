import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";
import { Pane } from "tweakpane";
import vertexShader from "./shaders/sampleVertex.glsl";
import fragmentShader from "./shaders/sampleFragment.glsl";

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

export const init = async (container) => {
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

function createPointsGeometryForSkin(skinnedMesh, numSamples) {
  const sampler = createSkinnedMeshSurfaceSampler(skinnedMesh);
  const sample = {
    position: new THREE.Vector3(),
    normal: new THREE.Vector3(),
    skinIndex: new THREE.Vector4(),
    skinWeight: new THREE.Vector4(),
    uv: new THREE.Vector2(),
  };

  const positions = new Float32Array(numSamples * 3);
  const normals = new Float32Array(numSamples * 3);
  const uvs = new Float32Array(numSamples * 2);
  const skinIndices = new Uint16Array(numSamples * 4);
  const skinWeights = new Float32Array(numSamples * 4);
  for (let i = 0; i < numSamples; i++) {
    sampler(
      sample.position,
      sample.normal,
      sample.uv,
      sample.skinIndex,
      sample.skinWeight
    );

    positions[i * 3 + 0] = sample.position.x;
    positions[i * 3 + 1] = sample.position.y;
    positions[i * 3 + 2] = sample.position.z;

    normals[i * 3 + 0] = sample.normal.x;
    normals[i * 3 + 1] = sample.normal.y;
    normals[i * 3 + 2] = sample.normal.z;

    uvs[i * 2 + 0] = sample.uv.x;
    uvs[i * 2 + 1] = sample.uv.y;

    skinIndices[i * 4 + 0] = sample.skinIndex.x;
    skinIndices[i * 4 + 1] = sample.skinIndex.y;
    skinIndices[i * 4 + 2] = sample.skinIndex.z;
    skinIndices[i * 4 + 3] = sample.skinIndex.w;

    skinWeights[i * 4 + 0] = sample.skinWeight.x;
    skinWeights[i * 4 + 1] = sample.skinWeight.y;
    skinWeights[i * 4 + 2] = sample.skinWeight.z;
    skinWeights[i * 4 + 3] = sample.skinWeight.w;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute(
    "skinIndex",
    new THREE.Uint16BufferAttribute(skinIndices, 4)
  );
  geometry.setAttribute(
    "skinWeight",
    new THREE.Float32BufferAttribute(skinWeights, 4)
  );
  return geometry;
}

function createSkinnedMeshSurfaceSampler(mesh) {
  const sampler = new MeshSurfaceSampler(mesh).build();
  const positionAttribute = getAttribute("position");
  const uvAttribute = getAttribute("uv");
  const skinIndexAttribute = getAttribute("skinIndex");
  const skinWeightAttribute = getAttribute("skinWeight");

  const face = new THREE.Triangle();
  const uvFace = [
    new THREE.Vector2(),
    new THREE.Vector2(),
    new THREE.Vector2(),
  ];
  const p = new THREE.Vector3();

  return sample;

  function getAttribute(name) {
    const attribute = mesh.geometry.getAttribute(name);
    if (attribute instanceof THREE.BufferAttribute) {
      return attribute;
    }
    return null;
  }

  function sample(
    targetPosition,
    targetNormal,
    targetUv,
    targetSkinIndex,
    targetSkinWeight
  ) {
    const cumulativeTotal =
      sampler.distribution[sampler.distribution.length - 1];

    const faceIndex = sampler.binarySearch(Math.random() * cumulativeTotal);

    let u = Math.random();
    let v = Math.random();

    if (u + v > 1) {
      u = 1 - u;
      v = 1 - v;
    }

    if (positionAttribute) {
      face.a.fromBufferAttribute(positionAttribute, faceIndex * 3);
      face.b.fromBufferAttribute(positionAttribute, faceIndex * 3 + 1);
      face.c.fromBufferAttribute(positionAttribute, faceIndex * 3 + 2);

      if (targetPosition) {
        targetPosition
          .set(0, 0, 0)
          .addScaledVector(face.a, u)
          .addScaledVector(face.b, v)
          .addScaledVector(face.c, 1 - (u + v));
      }

      if (targetNormal !== undefined) {
        face.getNormal(targetNormal);
      }
    }

    if (targetUv && uvAttribute) {
      uvFace[0].fromBufferAttribute(uvAttribute, faceIndex * 3);
      uvFace[1].fromBufferAttribute(uvAttribute, faceIndex * 3 + 1);
      uvFace[2].fromBufferAttribute(uvAttribute, faceIndex * 3 + 2);

      targetUv
        .set(0, 0)
        .addScaledVector(uvFace[0], u)
        .addScaledVector(uvFace[1], v)
        .addScaledVector(uvFace[2], 1 - (u + v));
    }

    if (positionAttribute) {
      let minDistance = Number.POSITIVE_INFINITY;
      let nearestVertIndex = -1;
      for (let i = 0; i < 3; i++) {
        const vertIndex = faceIndex * 3 + i;
        p.fromBufferAttribute(positionAttribute, vertIndex);
        const distance = p.distanceTo(targetPosition);
        if (distance < minDistance) {
          minDistance = distance;
          nearestVertIndex = vertIndex;
        }
      }

      if (targetSkinIndex && skinIndexAttribute) {
        targetSkinIndex.fromBufferAttribute(
          skinIndexAttribute,
          nearestVertIndex
        );
      }

      if (targetSkinWeight && skinWeightAttribute) {
        targetSkinWeight.fromBufferAttribute(
          skinWeightAttribute,
          nearestVertIndex
        );
      }
    }
  }
}
