struct LightInfo {
  vec3 diffuseColor;
  vec3 specularColor;
  // vec3 cascadedColor;
};

#if DIRECTION_LIGHT_COUNT
  struct DirectionLight {
    vec3 diffuseColor;
    vec3 specularColor;
    vec3 direction;
  };
  uniform DirectionLight u_directionLights[DIRECTION_LIGHT_COUNT];

  LightInfo calculateDirectionLightInfo(DirectionLight light, vec3 eyeDirection, vec3 normal) {
    LightInfo info;
    vec3 lightDirection = normalize(-light.direction);
    float ndl = dot(lightDirection, normal);
    float diffuse = max(ndl, 0.0);
    vec3 reflectDirection = reflect(-lightDirection, normal);
    float specular = 0.0;
    if (u_shininess > 0.0) {
      #ifdef NORMAL_MAP
        if (dot(lightDirection, v_normal) > 0.0) {
      #endif
      specular = pow(max(dot(reflectDirection, eyeDirection), 0.0), u_shininess);
      #ifdef NORMAL_MAP
        }
      #endif
    }

    #ifdef SHADOW
      int layer = 3;
      // vec3 cascadedColor = vec3(0.0, 0.0, 0.0);
      if (gl_FragCoord.z <= u_cascadedEnd.x) {
        layer = 0;
        // cascadedColor = vec3(0.0, 0.0, 0.2);
      } else if (gl_FragCoord.z <= u_cascadedEnd.y) {
        layer = 1;
        // cascadedColor = vec3(0.0, 0.2, 0.0);
      } else if (gl_FragCoord.z <= u_cascadedEnd.z) {
        layer = 2;
        // cascadedColor = vec3(0.2, 0.0, 0.0);
      }
      float shadow = calculateShadow(layer);
      diffuse *= shadow;
      specular *= shadow;
      // DEBUG:
      // info.cascadedColor = cascadedColor;
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

  LightInfo calculatePointLightInfo(PointLight light, vec3 eyeDirection, vec3 normal) {
    LightInfo info;
    vec3 lightDirection = light.position - v_worldPosition;
    float distance = length(lightDirection);
    lightDirection = normalize(lightDirection);
    float diffuse = max(dot(lightDirection, normal), 0.0);
    vec3 reflectDirection = reflect(-lightDirection, normal);
    float specular = 0.0;
    if (u_shininess > 0.0) {
      #ifdef NORMAL_MAP
        if (dot(lightDirection, v_normal) > 0.0) {
      #endif
      specular = pow(max(dot(reflectDirection, eyeDirection), 0.0), u_shininess);
      #ifdef NORMAL_MAP
        }
      #endif
    }
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

  LightInfo calculateSpotLightInfo(SpotLight light, vec3 eyeDirection, vec3 normal) {
    LightInfo info;
    vec3 lightDirection = light.position - v_worldPosition;
    float distance = length(lightDirection);
    lightDirection = normalize(lightDirection);
    float diffuse = max(dot(lightDirection, normal), 0.0);
    vec3 reflectDirection = reflect(-lightDirection, normal);
    float specular = 0.0;
    if (u_shininess > 0.0) {
      #ifdef NORMAL_MAP
        if (dot(lightDirection, v_normal) > 0.0) {
      #endif
      specular = pow(max(dot(reflectDirection, eyeDirection), 0.0), u_shininess);
      #ifdef NORMAL_MAP
        }
      #endif
    }
    float attenuation = 1.0;
    if (light.distance > 0.0) {
      attenuation = max(1.0 - distance / light.distance, 0.0);
    }
    float theta = dot(lightDirection, normalize(-light.direction));
    float epsilon = light.innerAngle - light.outerAngle;
    float intensity = clamp((theta - light.outerAngle) / epsilon, 0.0, 1.0);
    attenuation *= intensity;
    info.diffuseColor = light.diffuseColor * diffuse * attenuation;
    info.specularColor = light.specularColor * specular * attenuation;
    return info;
  }
#endif