#ifdef SKIN
  in vec4 a_joint;
  in vec4 a_weight;
  uniform mat4 u_jointMatrix[SKIN_JOINTS_COUNT];
#endif