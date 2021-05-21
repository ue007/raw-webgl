in vec3 a_position;
in vec3 a_normal;

uniform mat4 u_projectViewMatrix;
uniform mat4 u_modelMatrix;
uniform float u_outlineWidth;
uniform float u_outlineGap;
uniform bool u_outline;

void main() {
  // http://slides.com/xeolabs/silhouettes-in-webgl#/5
  mat4 mvpMatrix = u_projectViewMatrix * u_modelMatrix;
  vec4 position = mvpMatrix * vec4(a_position, 1.0);
  float offset = ((u_outline ? u_outlineWidth : 0.0) + u_outlineGap) * (position.z / 1000.0);
  gl_Position = mvpMatrix * vec4(a_position + a_normal * offset, 1.0);
}