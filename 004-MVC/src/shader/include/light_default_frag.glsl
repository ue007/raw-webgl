#if DIRECTION_LIGHT_COUNT
  for (int i = 0; i < DIRECTION_LIGHT_COUNT; i++) {
    DirectionLight light = u_directionLights[i];
    LightInfo info = calculateDirectionLightInfo(light, eyeDirection, normal);
    diffuseBase += info.diffuseColor;
    specularBase += info.specularColor;
    // DEBUG:
    // cascadedColor += info.cascadedColor;
  }
#endif

#if POINT_LIGHT_COUNT
  for (int i = 0; i < POINT_LIGHT_COUNT; i++) {
    PointLight light = u_pointLights[i];
    LightInfo info = calculatePointLightInfo(light, eyeDirection, normal);
    diffuseBase += info.diffuseColor;
    specularBase += info.specularColor;
  }
#endif

#if SPOT_LIGHT_COUNT
  for (int i = 0; i < SPOT_LIGHT_COUNT; i++) {
    SpotLight light = u_spotLights[i];
    LightInfo info = calculateSpotLightInfo(light, eyeDirection, normal);
    diffuseBase += info.diffuseColor;
    specularBase += info.specularColor;
  }
#endif