import * as THREE from "three";

const skinnedMeshFragmentShader = `
  layout(location = 0) out vec4 gPosition;
  layout(location = 1) out vec4 gColor;

  in vec4 vWorldPosition;
  in vec4 vVertexColor;

  void main() {
    gPosition = vec4(vWorldPosition.xyz, 0.0);
    gColor = vVertexColor;
  }
`;

const skinnedMeshVertexShader = `
  uniform int uMapWidth;
  uniform int uMapHeight;
  uniform sampler2D uColorMap;

  in float aFragIndex;

  out vec4 vWorldPosition;
  out vec4 vVertexColor;

  #include <common>
  #include <skinning_pars_vertex>

  void main() {
    #include <skinbase_vertex>
    
    #include <begin_vertex>
    #include <skinning_vertex>
    
    // Position this vertex so that it occupies a unique pixel.
    // Might not work in some environments...?
    // https://stackoverflow.com/questions/29053870/retrieve-vertices-data-in-three-js
    // https://stackoverflow.com/questions/20601886/does-gl-position-set-the-center-of-the-rectangle-when-using-gl-points
    vec2 destCoords = vec2(
      (0.5 + float(int(aFragIndex) % uMapWidth)) / float(uMapWidth),
      (0.5 + floor(float(aFragIndex) / float(uMapWidth))) / float(uMapHeight)
    ) * vec2(2.0) - vec2(1.0);
    
    gl_Position = vec4(destCoords, 0.0, 1.0);
    gl_PointSize = 1.0;
    
    vWorldPosition = modelMatrix * vec4(transformed, 1.0);
    vVertexColor = texture2D(uColorMap, uv);
  }
`;

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

export function createSavePass(texture, width, height, options) {
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
