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