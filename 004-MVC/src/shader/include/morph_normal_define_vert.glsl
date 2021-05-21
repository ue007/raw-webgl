#ifdef MORPH_TARGETS
  #if MORPH_TARGETS_COUNT > 0
    in vec3 a_normal0;
  #endif
  #if MORPH_TARGETS_COUNT > 1
    in vec3 a_normal1;
  #endif
  #if MORPH_TARGETS_COUNT > 2
    in vec3 a_normal2;
  #endif
  #if MORPH_TARGETS_COUNT > 3
    in vec3 a_normal3;
  #endif
#endif