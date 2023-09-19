import { CopyShader } from "three/examples/jsm/shaders/CopyShader.js";
import fragmentShader from "./frag.glsl";

export const COMPOSITE_SHADER_UNIFORMS = {
  uTime: { value: 0, type: "f" },
  uRGBShift: { value: 0.08 },
  uK1: { value: -0.2 },
  uK2: { value: -0.03 },
  uVignetteStrength: { value: 0 },
  uNoiseOpacity: { value: 0.13 },
  uGamma: { value: 0 },
  uExposure: { value: 0 },
  uContrast: { value: 0 },
};

export const CompositeShader = {
  uniforms: {
    tDiffuse: { value: null },
    ...COMPOSITE_SHADER_UNIFORMS,
  },
  vertexShader: CopyShader.vertexShader,
  fragmentShader,
};
