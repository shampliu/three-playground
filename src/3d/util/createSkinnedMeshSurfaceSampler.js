import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";
import * as THREE from "three";

export function createPointsGeometryForSkin(skinnedMesh, numSamples) {
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

export function createSkinnedMeshSurfaceSampler(mesh) {
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
