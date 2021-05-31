uniform float u_pointSize;
uniform mat4 u_projectViewMatrix;

layout(location = 0) in vec3 a_position;
layout(location = 1) in float a_age;
layout(location = 2) in float a_life;

out float v_age;
out float v_life;

void main() {
  v_age = a_age;
  v_life = a_life;
  gl_PointSize = u_pointSize + 20.0 * (1.0 - a_age / a_life);
  gl_Position = u_projectViewMatrix * vec4(a_position, 1.0);
}