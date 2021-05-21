#ifdef MORPH_TARGETS
  #if MORPH_TARGETS_COUNT > 0
    finalTangent += a_tangent0 * u_weights[0];
  #endif
  #if MORPH_TARGETS_COUNT > 1
    finalTangent += a_tangent1 * u_weights[1];
  #endif
  #if MORPH_TARGETS_COUNT > 2
    finalTangent += a_tangent2 * u_weights[2];
  #endif
  #if MORPH_TARGETS_COUNT > 3
    finalTangent += a_tangent3 * u_weights[3];
  #endif
#endif