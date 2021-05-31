#ifdef MORPH_TARGETS
  #if MORPH_TARGETS_COUNT > 0
    in vec3 a_position0;
  #endif
  #if MORPH_TARGETS_COUNT > 1
    in vec3 a_position1;
  #endif
  #if MORPH_TARGETS_COUNT > 2
    in vec3 a_position2;
  #endif
  #if MORPH_TARGETS_COUNT > 3
    in vec3 a_position3;
  #endif
  uniform float u_weights[MORPH_TARGETS_COUNT];
#endif

#ifdef SKIN
  in vec4 a_joint;
  in vec4 a_weight;
  uniform mat4 u_jointMatrix[SKIN_JOINTS_COUNT];
#endif

in vec3 a_position;
uniform mat4 u_projectViewMatrix;
uniform mat4 u_modelMatrix;

void main () {
  vec3 position = a_position;

  #ifdef MORPH_TARGETS
    #if MORPH_TARGETS_COUNT > 0
      position += a_position0 * u_weights[0];
    #endif
    #if MORPH_TARGETS_COUNT > 1
      position += a_position1 * u_weights[1];
    #endif
    #if MORPH_TARGETS_COUNT > 2
      position += a_position2 * u_weights[2];
    #endif
    #if MORPH_TARGETS_COUNT > 3
      position += a_position3 * u_weights[3];
    #endif
  #endif

  vec4 finalPosition = vec4(position, 1.0);

  #ifdef SKIN
    mat4 skinMat =
      a_weight.x * u_jointMatrix[int(a_joint.x)] +
      a_weight.y * u_jointMatrix[int(a_joint.y)] +
      a_weight.z * u_jointMatrix[int(a_joint.z)] +
      a_weight.w * u_jointMatrix[int(a_joint.w)];
    finalPosition = skinMat * finalPosition;
  #endif

  vec4 worldPosition = u_modelMatrix * finalPosition;
  gl_Position = u_projectViewMatrix * worldPosition;
}
