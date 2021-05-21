#ifdef MORPH_TARGETS
  #if MORPH_TARGETS_COUNT > 0
    finalNormal += a_normal0 * u_weights[0];
  #endif
  #if MORPH_TARGETS_COUNT > 1
    finalNormal += a_normal1 * u_weights[1];
  #endif
  #if MORPH_TARGETS_COUNT > 2
    finalNormal += a_normal2 * u_weights[2];
  #endif
  #if MORPH_TARGETS_COUNT > 3
    finalNormal += a_normal3 * u_weights[3];
  #endif
#endif