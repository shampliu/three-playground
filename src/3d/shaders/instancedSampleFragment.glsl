precision highp float;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vOpacity;

uniform vec3 uColor;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightPos = normalize(vec3(0., 100., 100.));

  vec3 diffuse = uColor;
  float dp = max(0., dot(normal, lightPos));
	float fullShadow = smoothstep(0.5, 0.505, dp);
	float partialShadow = smoothstep(0.65, 0.655, dp) * .5 + .5;
	dp = min(fullShadow, partialShadow);

  diffuse *= .5;
	diffuse += dp * .2;

	vec3 specular = vec3(0.);
	vec3 r = normalize(reflect(-lightPos, normal));
	float phongValue = max(0., dot(r, normalize(vViewPosition)));
	phongValue = pow(phongValue, 16.);

	specular += phongValue;
	specular = smoothstep(0.5, .51, specular);

	
	float fresnel = 1. - max(0., dot(normalize(vViewPosition), normal));
	fresnel = pow(fresnel, 2.);
	
	diffuse += specular * .2 + fresnel * .2;
	// specular *= fresnel;




  // gl_FragColor = dot()

  gl_FragColor = vec4(diffuse, vOpacity);
 
}