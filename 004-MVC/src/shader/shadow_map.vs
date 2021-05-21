#include <morph_define_vert>

#include <skin_define_vert>

in vec3 a_position;
uniform mat4 u_projectViewMatrix;
uniform mat4 u_modelMatrix;

void main () {
  vec3 position = a_position;

  #include <morph_vert>

  vec4 finalPosition = vec4(position, 1.0);

  #include <skin_vert>

  vec4 worldPosition = u_modelMatrix * finalPosition;
  gl_Position = u_projectViewMatrix * worldPosition;
}
