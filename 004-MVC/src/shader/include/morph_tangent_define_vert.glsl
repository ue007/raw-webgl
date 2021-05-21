#ifdef MORPH_TARGETS
  #if MORPH_TARGETS_COUNT > 0
    in vec4 a_tangent0;
  #endif
  #if MORPH_TARGETS_COUNT > 1
    in vec4 a_tangent1;
  #endif
  #if MORPH_TARGETS_COUNT > 2
    in vec4 a_tangent2;
  #endif
  #if MORPH_TARGETS_COUNT > 3
    in vec4 a_tangent3;
  #endif
#endif