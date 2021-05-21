struct LightInfo {
  vec3 diffuseColor;
  vec3 specularColor;
};

#if DIRECTION_LIGHT_COUNT
  struct DirectionLight {
    vec3 diffuseColor;
    vec3 specularColor;
    vec3 direction;
  };
  uniform DirectionLight u_directionLights[DIRECTION_LIGHT_COUNT];

  LightInfo calculateDirectionLightInfo(DirectionLight light, vec3 v, vec3 n, float NdotV,
      vec3 specularEnvironmentR0, vec3 specularEnvironmentR90, float roughnessSq) {
    LightInfo info;

    vec3 l = normalize(-light.direction);
    vec3 h = normalize(l+v); // Half vector between both l and v

    float NdotL = clamp(dot(n, l), 0.001, 1.0);
    float NdotH = clamp(dot(n, h), 0.0, 1.0);
    float VdotH = clamp(dot(v, h), 0.0, 1.0);

    vec3 F = specularEnvironmentR0 + (specularEnvironmentR90 - specularEnvironmentR0) * pow(clamp(1.0 - VdotH, 0.0, 1.0), 5.0);

    float attenuationL = 2.0 * NdotL / (NdotL + sqrt(roughnessSq + (1.0 - roughnessSq) * (NdotL * NdotL)));
    float attenuationV = 2.0 * NdotV / (NdotV + sqrt(roughnessSq + (1.0 - roughnessSq) * (NdotV * NdotV)));
    float G = attenuationL * attenuationV;

    float f = (NdotH * roughnessSq - NdotH) * NdotH + 1.0;
    float D = roughnessSq / (M_PI * f * f);

    // Calculation of analytical lighting contribution
    vec3 diffuse = NdotL * (1.0 - F) * light.diffuseColor;
    vec3 specular = NdotL * F * G * D / NdotL * light.specularColor;

    #ifdef SHADOW
      int layer = 3;
      if (gl_FragCoord.z <= u_cascadedEnd.x) {
        layer = 0;
      } else if (gl_FragCoord.z <= u_cascadedEnd.y) {
        layer = 1;
      } else if (gl_FragCoord.z <= u_cascadedEnd.z) {
        layer = 2;
      }
      float shadow = calculateShadow(layer);
      diffuse *= shadow;
      specular *= shadow;
    #endif

    info.diffuseColor = light.diffuseColor * diffuse;
    info.specularColor = light.specularColor * specular;
    return info;
  }
#endif

#if POINT_LIGHT_COUNT
  struct PointLight {
    vec3 diffuseColor;
    vec3 specularColor;
    vec3 position;
    float distance;
  };
  uniform PointLight u_pointLights[POINT_LIGHT_COUNT];

  LightInfo calculatePointLightInfo(PointLight light, vec3 v, vec3 n, float NdotV,
      vec3 specularEnvironmentR0, vec3 specularEnvironmentR90, float roughnessSq) {
    LightInfo info;

    vec3 l = light.position - v_worldPosition;
    float distance = length(l);
    l = normalize(light.position - v_worldPosition);
    vec3 h = normalize(l+v); // Half vector between both l and v

    float NdotL = clamp(dot(n, l), 0.001, 1.0);
    float NdotH = clamp(dot(n, h), 0.0, 1.0);
    float VdotH = clamp(dot(v, h), 0.0, 1.0);

    vec3 F = specularEnvironmentR0 + (specularEnvironmentR90 - specularEnvironmentR0) * pow(clamp(1.0 - VdotH, 0.0, 1.0), 5.0);

    float attenuationL = 2.0 * NdotL / (NdotL + sqrt(roughnessSq + (1.0 - roughnessSq) * (NdotL * NdotL)));
    float attenuationV = 2.0 * NdotV / (NdotV + sqrt(roughnessSq + (1.0 - roughnessSq) * (NdotV * NdotV)));
    float G = attenuationL * attenuationV;

    float f = (NdotH * roughnessSq - NdotH) * NdotH + 1.0;
    float D = roughnessSq / (M_PI * f * f);

    // Calculation of analytical lighting contribution
    vec3 diffuse = NdotL * (1.0 - F) * light.diffuseColor;
    vec3 specular = NdotL * F * G * D / NdotL * light.specularColor;

    float attenuation = 1.0;
    if (light.distance > 0.0) {
      attenuation = max(1.0 - distance / light.distance, 0.0);
    }
    info.diffuseColor = light.diffuseColor * diffuse * attenuation;
    info.specularColor = light.specularColor * specular * attenuation;
    return info;
  }
#endif

#if SPOT_LIGHT_COUNT
  struct SpotLight {
    vec3 diffuseColor;
    vec3 specularColor;
    vec3 direction;
    vec3 position;
    float distance;
    float innerAngle;
    float outerAngle;
  };
  uniform SpotLight u_spotLights[SPOT_LIGHT_COUNT];

  LightInfo calculateSpotLightInfo(SpotLight light, vec3 v, vec3 n, float NdotV,
      vec3 specularEnvironmentR0, vec3 specularEnvironmentR90, float roughnessSq) {
    LightInfo info;

    vec3 l = light.position - v_worldPosition;
    float distance = length(l);
    l = normalize(light.position - v_worldPosition);
    vec3 h = normalize(l+v); // Half vector between both l and v

    float NdotL = clamp(dot(n, l), 0.001, 1.0);
    float NdotH = clamp(dot(n, h), 0.0, 1.0);
    float VdotH = clamp(dot(v, h), 0.0, 1.0);

    vec3 F = specularEnvironmentR0 + (specularEnvironmentR90 - specularEnvironmentR0) * pow(clamp(1.0 - VdotH, 0.0, 1.0), 5.0);

    float attenuationL = 2.0 * NdotL / (NdotL + sqrt(roughnessSq + (1.0 - roughnessSq) * (NdotL * NdotL)));
    float attenuationV = 2.0 * NdotV / (NdotV + sqrt(roughnessSq + (1.0 - roughnessSq) * (NdotV * NdotV)));
    float G = attenuationL * attenuationV;

    float f = (NdotH * roughnessSq - NdotH) * NdotH + 1.0;
    float D = roughnessSq / (M_PI * f * f);

    // Calculation of analytical lighting contribution
    vec3 diffuse = NdotL * (1.0 - F) * light.diffuseColor;
    vec3 specular = NdotL * F * G * D / NdotL * light.specularColor;

    float attenuation = 1.0;
    if (light.distance > 0.0) {
      attenuation = max(1.0 - distance / light.distance, 0.0);
    }
    float theta = dot(l, normalize(-light.direction));
    float epsilon = light.innerAngle - light.outerAngle;
    float intensity = clamp((theta - light.outerAngle) / epsilon, 0.0, 1.0);
    attenuation *= intensity;
    info.diffuseColor = light.diffuseColor * diffuse * attenuation;
    info.specularColor = light.specularColor * specular * attenuation;
    return info;
  }
#endif