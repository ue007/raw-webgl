/* uniform vec3 u_cameraRight;
uniform vec3 u_cameraUp;
uniform vec3 u_center;
uniform vec2 u_size;
uniform mat4 u_projectViewMatrix;
in vec3 a_position;
// in vec2 a_uv;
// out vec2 v_uv;

void main() {
  // v_uv = a_uv;
  vec3 worldPosition =
    u_center
    + u_cameraRight * a_position.x * u_size.x
    + u_cameraUp * a_position.y * u_size.y;
  gl_Position = u_projectViewMatrix * vec4(worldPosition, 1.0);
} */

uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectMatrix;
in vec3 a_position;
// in vec2 a_uv;
// out vec2 v_uv;

void main() {
  mat4 modelViewMatrix = u_viewMatrix * u_modelMatrix;
  // First colunm.
  modelViewMatrix[0][0] = 1.0;
  modelViewMatrix[0][1] = 0.0;
  modelViewMatrix[0][2] = 0.0;

   // if (spherical == 1) {
    // Second colunm.
    modelViewMatrix[1][0] = 0.0;
    modelViewMatrix[1][1] = 1.0;
    modelViewMatrix[1][2] = 0.0;
  // }

  // Thrid colunm.
  modelViewMatrix[2][0] = 0.0;
  modelViewMatrix[2][1] = 0.0;
  modelViewMatrix[2][2] = 1.0;

  gl_Position = u_projectMatrix * modelViewMatrix * vec4(a_position, 1.0);
}
