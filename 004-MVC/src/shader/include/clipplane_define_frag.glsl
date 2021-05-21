#if defined(CLIPPLANE)
  uniform vec4 u_clipPlane;
#endif

#if defined(CLIPPLANE) || defined(DIFFUSE_CUBE_MAP)
  in vec3 v_modelPosition;
#endif