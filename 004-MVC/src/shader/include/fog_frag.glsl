#ifdef FOG
  float distance = length(eyeSpacePosition);
  float fogFactor = clamp((distance - u_fogNear) / (u_fogFar - u_fogNear), 0.0, 1.0);
  fragColor.rgb = mix(fragColor.rgb, u_fogColor, fogFactor);
#endif