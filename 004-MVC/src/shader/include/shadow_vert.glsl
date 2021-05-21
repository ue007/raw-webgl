#ifdef SHADOW
  v_shadowMapPosition[0] = u_shadowMapProjectViewMatrix_0 * worldPosition;
  v_shadowMapPosition[1] = u_shadowMapProjectViewMatrix_1 * worldPosition;
  v_shadowMapPosition[2] = u_shadowMapProjectViewMatrix_2 * worldPosition;
  v_shadowMapPosition[3] = u_shadowMapProjectViewMatrix_3 * worldPosition;
#endif