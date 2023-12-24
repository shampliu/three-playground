import fragmentShader from "./frag.glsl";
import vertexShader from "./vert.glsl";
import * as THREE from "three";

export const ASCIIShader = {
  uniforms: {
    tDiffuse: { value: null },
    uASCIISize: { value: 0 },
    uResolution: { value: new THREE.Vector2() },
    uNumCharacters: { value: 0 },
    uDimensions: { value: null },
    tFont: { value: null },
    uTime: { value: 0, type: "f" },
  },
  vertexShader,
  fragmentShader,
};
