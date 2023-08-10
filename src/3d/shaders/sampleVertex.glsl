attribute vec3 position;
attribute vec2 uv;

varying vec2 vUv;
varying vec4 vWorldPosition;

uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;

#ifdef INSTANCING
  attribute mat4 instanceMatrix;
#endif

attribute vec4 skinIndex;
attribute vec4 skinWeight;

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


void main() {
  mat4 boneMatX = getBoneMatrix( skinIndex.x );
  mat4 boneMatY = getBoneMatrix( skinIndex.y );
  mat4 boneMatZ = getBoneMatrix( skinIndex.z );
  mat4 boneMatW = getBoneMatrix( skinIndex.w );

  vUv = uv;

  vec3 transformed = vec3(position);
  vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
  vec4 skinned = vec4( 0.0 );
  skinned += boneMatX * skinVertex * skinWeight.x;
  skinned += boneMatY * skinVertex * skinWeight.y;
  skinned += boneMatZ * skinVertex * skinWeight.z;
  skinned += boneMatW * skinVertex * skinWeight.w;
  transformed = ( bindMatrixInverse * skinned ).xyz;

  // #ifdef INSTANCING
  //   worldPosition = instanceMatrix * worldPosition;
  // #endif

  vWorldPosition = modelMatrix * vec4(transformed, 1.);
  
  gl_Position = projectionMatrix * viewMatrix * vWorldPosition;
  gl_PointSize = 10.;
}