import filmGrainF from "./frag.glsl";
import filmGrainV from "./vert.glsl";

export const FilmGrainShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0, type: "f" },
  },
  vertexShader: filmGrainV,
  fragmentShader: filmGrainF,
};
