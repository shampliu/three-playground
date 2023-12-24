uniform float uTime;
uniform sampler2D tDiffuse;
uniform float uASCIISize;
uniform sampler2D tFont;
uniform float uNumCharacters;

uniform vec2 uResolution;


varying vec2 vUv;

float avgColor(vec3 color) {
  return (color.r + color.g + color.b) / 3.;
}

float getMSDFText(vec2 coord) {
    vec3 tex = texture(tFont, coord).rgb;
    float signedDist = max(min(tex.r, tex.g), min(max(tex.r, tex.g), tex.b)) - 0.5;
    float d = fwidth(signedDist);
    float alpha = smoothstep(-d, d, signedDist);
    return step(0.01, alpha) * alpha;
}

void main() {
  vec2 cell = floor(gl_FragCoord.xy / uASCIISize);
  vec2 cellUv = (cell * uASCIISize) / uResolution.xy;

  vec2 asciiUv = mod(gl_FragCoord.xy, uASCIISize) / uASCIISize;
  // float ascii = 1. - getMSDFText(asciiUv);


  vec2 divisions = uResolution / uASCIISize;
  vec2 cellSize = 1. / divisions;
  vec2 pixelatedUv = cellSize * (floor(vUv / cellSize) + 0.5);




  vec3 color = texture2D( tDiffuse, cellUv ).rgb;
  float greyscale = avgColor(color);

  // greyscale = (greyscale - .5) * 1.5 + 0.5 + .2; // TODO: add contrast shader

  float charIndex = floor(greyscale * (uNumCharacters - 1.));

  vec2 size = vec2(16.);
  float charX = mod(charIndex, size.x);
  float charY = floor(charIndex / size.y);
  vec2 charUV = mod(vUv * (divisions/size), 1./size);

  charUV -= vec2(0., 1. / size);
  vec2 offset = vec2(charX, -charY) / size;
  charUV += offset;

  vec4 ascii = texture2D(tFont, charUV);
  vec4 finalColor = ascii * greyscale;



  // gl_FragColor = vec4(vec3(ascii), 1.);
  gl_FragColor = vec4(finalColor.rgb, 1.);
  // gl_FragColor = vec4(vec3(greyscale), 1.);
}
