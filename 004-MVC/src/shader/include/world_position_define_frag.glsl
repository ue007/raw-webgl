#if defined(LIGHT) || defined(FOG) || defined(ENV_MAP)
  uniform vec3 u_eyePosition;
  in vec3 v_worldPosition;
#endif