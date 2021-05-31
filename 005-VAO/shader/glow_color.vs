in vec3 a_position;

uniform mat4 u_projectViewMatrix;
uniform mat4 u_modelMatrix;

void main() {
  gl_Position = u_projectViewMatrix * u_modelMatrix * vec4(a_position, 1.0);
}