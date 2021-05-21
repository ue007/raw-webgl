#ifdef CLIPPLANE
  float clipDistance = dot(v_modelPosition, u_clipPlane.xyz);
  if (clipDistance >= u_clipPlane.w) {
    discard;
  }
#endif