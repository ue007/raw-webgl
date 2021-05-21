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