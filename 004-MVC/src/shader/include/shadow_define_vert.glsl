#ifdef SHADOW
  #define CASCADED_COUNT 4
  uniform mat4 u_shadowMapProjectViewMatrix_0;
  uniform mat4 u_shadowMapProjectViewMatrix_1;
  uniform mat4 u_shadowMapProjectViewMatrix_2;
  uniform mat4 u_shadowMapProjectViewMatrix_3;
  out vec4 v_shadowMapPosition[CASCADED_COUNT];
#endif