#ifdef ALPHA_TEST
  if (baseColor.a < u_alphaCutoff) {
    discard;
  }
  baseColor.a = 1.0;
#endif