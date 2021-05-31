#ifdef VERTEX_COLOR
  in vec4 v_color;
#endif

#ifdef DIFFUSE_MAP1
  uniform sampler2D u_diffuseSampler1;
#endif

#ifdef DIFFUSE_MAP2
  uniform sampler2D u_diffuseSampler2;
#endif

#ifdef DIFFUSE_MAP3
  uniform sampler2D u_diffuseSampler3;
#endif

#ifdef MIX_MAP
  uniform sampler2D u_mixSampler;
#endif

#if defined(LIGHT)
  in vec3 v_normal;
#endif

#if defined(MIX_MAP) || defined(DIFFUSE_MAP1) || defined(DIFFUSE_MAP2) || defined(DIFFUSE_MAP3) || defined(NORMAL_MAP)
  #if defined(MIX_MAP)
    uniform vec2 u_textureScale;
  #endif
  #if defined(DIFFUSE_MAP1)
    uniform vec2 u_textureScale1;
  #endif
  #if defined(DIFFUSE_MAP2)
    uniform vec2 u_textureScale2;
  #endif
  #if defined(DIFFUSE_MAP3)
    uniform vec2 u_textureScale3;
  #endif
  in vec2 v_uv;
#endif

#if defined(LIGHT) || defined(FOG) || defined(ENV_MAP)
  uniform vec3 u_eyePosition;
  in vec3 v_worldPosition;
#endif

#ifdef LIGHT
  uniform float u_shininess;
  uniform vec3 u_specularColor;

  #ifdef NORMAL_MAP
    #if defined(NORMAL_MAP1)
      uniform sampler2D u_normalSampler1;
    #endif
    #if defined(NORMAL_MAP2)
      uniform sampler2D u_normalSampler2;
    #endif
    #if defined(NORMAL_MAP3)
      uniform sampler2D u_normalSampler3;
    #endif
    in mat3 v_TBN;
  #endif

  #define PCF_SHADOW
  #ifdef SHADOW
    #define CASCADED_COUNT 4
    in vec4 v_shadowMapPosition[CASCADED_COUNT];
    uniform highp sampler2DArrayShadow u_shadowMapSampler;
    uniform vec4 u_cascadedEnd;
  
    float calculateShadow (int layer) {
      vec3 position = v_shadowMapPosition[layer].xyz / v_shadowMapPosition[layer].w;
      position = position * 0.5 + 0.5;
      vec4 shadowUv = vec4(position.xy, float(layer), position.z - 0.005);
  
      #ifdef PCF_SHADOW
        vec2 size = 1.0 / vec2(2048.0, 2048.0);
        float depth = 0.0;
        for (int x = -1; x <= 1; ++x) {
          for (int y = -1; y <= 1; ++y) {
            shadowUv.xy = position.xy + vec2(x, y) * size;
            float pcfDepth = texture(u_shadowMapSampler, shadowUv);
            depth += pcfDepth;
          }
        }
        depth /= 9.0;
        return depth;
      #else
        float depth = texture(u_shadowMapSampler, shadowUv);
        return depth;
      #endif
    }
  #endif

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
#endif

#ifdef WIREFRAME
  uniform vec3 u_wireframeColor;
  uniform float u_wireframeWidth;
  in vec3 v_barycentric;

  float edgeFactor () {
    vec3 d = fwidth(v_barycentric);
    vec3 a3 = smoothstep(vec3(0.0), d * u_wireframeWidth, v_barycentric);
    return min(min(a3.x, a3.y), a3.z);
  }
#endif

#if defined(CLIPPLANE)
  uniform vec4 u_clipPlane;
#endif

#if defined(CLIPPLANE) || defined(DIFFUSE_CUBE_MAP)
  in vec3 v_modelPosition;
#endif

#ifdef FOG
  uniform vec3 u_fogColor;
  uniform float u_fogNear;
  uniform float u_fogFar;
#endif

const vec3 gammaValue = vec3(2.2);
const vec3 gammaInvValue = vec3(1.0 / 2.2);

vec3 gammaInput (vec3 color) {
  #ifdef GAMMA_INPUT
    return pow(color, gammaValue);
  #else
    return color;
  #endif
}

vec3 gammaOutput (vec3 color) {
  return pow(color, gammaInvValue);
}

// https://github.com/google/filament/blob/b3d758f3b3fdf91b750a7561a1c729649cf4c1e8/shaders/src/common_graphics.fs
float luminance(const vec3 linear) {
  return dot(linear, vec3(0.2126, 0.7152, 0.0722));
}

// https://github.com/google/filament/blob/b3d758f3b3fdf91b750a7561a1c729649cf4c1e8/shaders/src/tone_mapping.fs
vec3 tonemapACES(const vec3 x) {
  // Narkowicz 2015, "ACES Filmic Tone Mapping Curve"
  const float a = 2.51;
  const float b = 0.03;
  const float c = 2.43;
  const float d = 0.59;
  const float e = 0.14;
  return (x * (a * x + b)) / (x * (c * x + d) + e);
}


uniform vec4 u_diffuseColor;
uniform float u_transparency;
out vec4 fragColor;

void main () {
  #ifdef CLIPPLANE
    float clipDistance = dot(v_modelPosition, u_clipPlane.xyz);
    if (clipDistance >= u_clipPlane.w) {
      discard;
    }
  #endif

  #if defined(LIGHT) || defined(FOG)
    vec3 eyeSpacePosition = u_eyePosition - v_worldPosition;
  #endif

  #if defined(WIREFRAME) && defined(WIREFRAME_ONLY)
    fragColor = vec4(u_wireframeColor, (1.0 - edgeFactor()) * u_transparency);
  #else
    #ifdef MIX_MAP
      vec4 mixColor = texture(u_mixSampler, v_uv * u_textureScale);
      vec4 baseColor = mixColor;
      #ifdef DIFFUSE_MAP1
        vec3 diffuseColor1 = texture(u_diffuseSampler1, v_uv * u_textureScale1).rgb;
        diffuseColor1 = gammaInput(diffuseColor1);
      #else
        vec3 diffuseColor1 = vec3(1.0);
      #endif
      #ifdef DIFFUSE_MAP2
        vec3 diffuseColor2 = texture(u_diffuseSampler2, v_uv * u_textureScale2).rgb;
        diffuseColor2 = gammaInput(diffuseColor2);
      #else
        vec3 diffuseColor2 = vec3(1.0);
      #endif
      #ifdef DIFFUSE_MAP3
        vec3 diffuseColor3 = texture(u_diffuseSampler3, v_uv * u_textureScale3).rgb;
        diffuseColor3 = gammaInput(diffuseColor3);
      #else
        vec3 diffuseColor3 = vec3(1.0);
      #endif
      diffuseColor1 *= baseColor.r;
      diffuseColor2 = mix(diffuseColor1, diffuseColor2, baseColor.g);
      baseColor.rgb = mix(diffuseColor2, diffuseColor3, baseColor.b);
    #else
      vec4 baseColor = vec4(1.0);
    #endif

    #ifdef VERTEX_COLOR
      baseColor *= v_color;
    #endif

    baseColor.a *= u_transparency;

    #ifdef LIGHT
      #ifdef NORMAL_MAP
        #if defined(NORMAL_MAP1)
          vec3 normalColor1 = texture(u_normalSampler1, v_uv * u_textureScale1).rgb;
        #else
          vec3 normalColor1 = vec3(1.0);
        #endif
        #if defined(NORMAL_MAP2)
          vec3 normalColor2 = texture(u_normalSampler2, v_uv * u_textureScale2).rgb;
        #else
          vec3 normalColor2 = vec3(1.0);
        #endif
        #if defined(NORMAL_MAP3)
          vec3 normalColor3 = texture(u_normalSampler3, v_uv * u_textureScale3).rgb;
        #else
          vec3 normalColor3 = vec3(1.0);
        #endif
        normalColor1 *= mixColor.r;
        normalColor2 = mix(normalColor1, normalColor2, mixColor.g);
        vec3 normalColor = mix(normalColor2, normalColor3, mixColor.b);
        vec3 normal = normalize((normalColor * 2.0 - 1.0).rgb);
        normal = normalize(v_TBN * normal);
      #else
        vec3 normal = normalize(v_normal);
      #endif

      if (!gl_FrontFacing) {
        normal = -normal;
      }

      vec3 diffuseBase = vec3(0.0);
      vec3 specularBase = vec3(0.0);
      vec3 eyeDirection = normalize(eyeSpacePosition);

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

      specularBase *= u_specularColor;
      vec3 finalColor = clamp(diffuseBase * u_diffuseColor.rgb * baseColor.rgb, 0.0, 1.0);
      finalColor += specularBase;
      baseColor = vec4(finalColor, u_diffuseColor.a * baseColor.a);
    #else
      baseColor = vec4(u_diffuseColor.rgb * baseColor.rgb, u_diffuseColor.a * baseColor.a);
    #endif
    baseColor.rgb = gammaOutput(baseColor.rgb);
    #ifdef WIREFRAME
      fragColor = mix(vec4(u_wireframeColor, u_transparency), baseColor, edgeFactor());
    #else
      fragColor = baseColor;
    #endif
  #endif

  #ifdef FOG
    float distance = length(eyeSpacePosition);
    float fogFactor = clamp((distance - u_fogNear) / (u_fogFar - u_fogNear), 0.0, 1.0);
    fragColor.rgb = mix(fragColor.rgb, u_fogColor, fogFactor);
  #endif
}
