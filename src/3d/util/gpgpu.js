import * as THREE from "three";

/**
 * Emulate the Transform Feedback of SkinnedMesh using the render target texture.
 * https://stackoverflow.com/questions/29053870/retrieve-vertices-data-in-three-js
 */
export function createVertexStore(geometry, colorMap) {
  const numVertices = geometry.attributes.position.count;

  /**
   * Add a vertex attribute to find the 2D coordinates of the fragment
   * that will store the vertex position and color.
   * One vertex corresponds to one fragment.
   */
  const fragIndices = new Float32Array(numVertices);
  for (let i = 0; i < numVertices; i++) {
    fragIndices[i] = i;
  }
  geometry.setAttribute(
    "aFragIndex",
    new THREE.Float32BufferAttribute(fragIndices, 1)
  );

  const mapWidth = 512;
  const mapHeight = THREE.MathUtils.ceilPowerOfTwo(
    Math.ceil(numVertices / mapWidth)
  );
  const renderTargetOptions = {
    depthBuffer: false,
    stencilBuffer: false,
    type: THREE.FloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
  };
  const renderTarget = new THREE.WebGLMultipleRenderTargets(
    mapWidth,
    mapHeight,
    2,
    renderTargetOptions
  );
  renderTarget.texture[0].name = "position";
  renderTarget.texture[1].name = "color";

  /**
   * An object to copy the texture where the vertex positions are stored.
   * It will be used later to calculate the vertex velocity.
   */
  const positionMapSaver = createSavePass(
    renderTarget.texture[0],
    mapWidth,
    mapHeight,
    renderTargetOptions
  );

  const material = new THREE.ShaderMaterial({
    defines: {
      USE_UV: "",
    },
    uniforms: {
      uMapWidth: {
        value: mapWidth,
      },
      uMapHeight: {
        value: mapHeight,
      },
      uColorMap: {
        value: colorMap,
      },
    },
    glslVersion: THREE.GLSL3,
    vertexShader: skinnedMeshVertexShader,
    fragmentShader: skinnedMeshFragmentShader,
  });

  const scene = new THREE.Scene();

  return {
    numVertices,
    mapWidth,
    mapHeight,
    geometry,
    material,
    scene,
    positionMap: renderTarget.texture[0],
    colorMap: renderTarget.texture[1],
    prevPositionMap: positionMapSaver.texture,
    update,
  };

  function update() {
    positionMapSaver.update();

    const { renderer, camera } = webgl;
    const originalRenderTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);
    renderer.setRenderTarget(originalRenderTarget);
  }
}

export function createSavePass(
  texture: THREE.Texture,
  width: number,
  height: number,
  options?: THREE.WebGLRenderTargetOptions
) {
  const renderTarget = new THREE.WebGLRenderTarget(width, height, options);

  const scene = new THREE.Scene();
  const uniforms = {
    uTexture: {
      value: texture,
    },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec2 vUv;

      void main() {
        gl_Position = vec4(position, 1.0);
        vUv = uv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uTexture;
      varying vec2 vUv;

      void main() {
        gl_FragColor = texture2D(uTexture, vUv);
      }
    `,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
  return {
    texture: renderTarget.texture,
    update,
  };

  function update() {
    const { renderer, camera } = webgl;
    const originalRenderTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);
    renderer.setRenderTarget(originalRenderTarget);
  }
}
