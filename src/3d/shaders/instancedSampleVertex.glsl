attribute vec3 position;
attribute vec2 uv;
attribute vec3 normal;

attribute vec3 iPosition;
attribute float iLife;
attribute float iSize;
attribute float iSpeed;
attribute vec3 iAxis;

varying vec2 vUv;
varying vec4 vWorldPosition;
varying vec3 vNormal;
varying float vOpacity;
varying vec3 vViewPosition;

uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform vec3 cameraPosition;

uniform float uTime;

#ifdef INSTANCING
  attribute mat4 instanceMatrix;
#endif

attribute vec4 iSkinIndex;
attribute vec4 iSkinWeight;

uniform mat4 bindMatrix;
uniform mat4 bindMatrixInverse;
uniform highp sampler2D boneTexture;
uniform int boneTextureSize;

mat4 getBoneMatrix( const in float i ) {
    float j = i * 4.0;
    float x = mod( j, float( boneTextureSize ) );
    float y = floor( j / float( boneTextureSize ) );
    float dx = 1.0 / float( boneTextureSize );
    float dy = 1.0 / float( boneTextureSize );
    y = dy * ( y + 0.5 );
    vec4 v1 = texture2D( boneTexture, vec2( dx * ( x + 0.5 ), y ) );
    vec4 v2 = texture2D( boneTexture, vec2( dx * ( x + 1.5 ), y ) );
    vec4 v3 = texture2D( boneTexture, vec2( dx * ( x + 2.5 ), y ) );
    vec4 v4 = texture2D( boneTexture, vec2( dx * ( x + 3.5 ), y ) );
    mat4 bone = mat4( v1, v2, v3, v4 );
    return bone;
}

float cubicInOut(float t) {
  return t < 0.5
    ? 4.0 * t * t * t
    : 0.5 * pow(2.0 * t - 2.0, 3.0) + 1.0;
}

 mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

vec3 rotate(vec3 v, vec3 axis, float angle) {
  mat4 m = rotationMatrix(axis, angle);
  return (m * vec4(v, 1.0)).xyz;
}

void main() {
  vUv = uv;
  // vNormal = normalMatrix * normal; // TODO: what is normalMatrix
  vNormal = normal;

  float progress = (mod(uTime, iLife) / iLife);
  progress = cubicInOut(progress);
  vOpacity = progress;

  vec3 transformed = vec3(position);
  transformed *= progress * iSize;

  transformed = rotate(transformed, iAxis, progress * 20.);
  vNormal = rotate(vNormal, iAxis, progress * 20.);

  transformed += iPosition;

  mat4 boneMatX = getBoneMatrix( iSkinIndex.x );
  mat4 boneMatY = getBoneMatrix( iSkinIndex.y );
  mat4 boneMatZ = getBoneMatrix( iSkinIndex.z );
  mat4 boneMatW = getBoneMatrix( iSkinIndex.w );

  // vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
  vec4 skinVertex = vec4(transformed, 1.);
  vec4 skinned = vec4( 0.0 );
  skinned += boneMatX * skinVertex * iSkinWeight.x;
  skinned += boneMatY * skinVertex * iSkinWeight.y;
  skinned += boneMatZ * skinVertex * iSkinWeight.z;
  skinned += boneMatW * skinVertex * iSkinWeight.w;
  // transformed = ( bindMatrixInverse * skinned ).xyz;
  transformed = skinned.xyz;

  // displacement
  
  transformed.y += progress * 1. * iSpeed;

  // normal
  mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += iSkinWeight.x * boneMatX;
	skinMatrix += iSkinWeight.y * boneMatY;
	skinMatrix += iSkinWeight.z * boneMatZ;
	skinMatrix += iSkinWeight.w * boneMatW;
	// skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;

	vNormal = vec4( modelMatrix * skinMatrix * vec4( vNormal, 0.0 ) ).xyz;

  vWorldPosition = modelMatrix * vec4(transformed, 1.);
  vViewPosition = (viewMatrix * vWorldPosition).xyz;
  
  gl_Position = projectionMatrix * viewMatrix * vWorldPosition;
}