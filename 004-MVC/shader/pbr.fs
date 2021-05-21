const float M_PI = 3.141592653589793;
const float c_minRoughness = 0.04;

#ifdef PBR_TYPE_METALNESS
  uniform vec4 u_baseColorFactor;
  uniform float u_metallicFactor;
  uniform float u_roughnessFactor;
#endif

#ifdef PBR_TYPE_SPECULAR
  uniform vec4 u_diffuseFactor;
  uniform vec3 u_specularFactor;
  uniform float u_glossinessFactor;
#endif

uniform float u_transparency;

#ifdef VERTEX_COLOR
  in vec4 v_color;
#endif

#ifdef BASE_COLOR_MAP
  uniform sampler2D u_baseColorSampler;
#endif

#ifdef METALLIC_ROUGHNESS_MAP
  #ifdef SEPARATE_METALLIC_ROUGHNESS
    uniform sampler2D u_metallicSampler;
    uniform sampler2D u_roughnessSampler;
  #else
    uniform sampler2D u_metallicRoughnessSampler;
  #endif
#endif

#ifdef DIFFUSE_MAP
  uniform sampler2D u_diffuseSampler;
#endif

#ifdef SPECULAR_GLOSSINESS_MAP
  #ifdef SEPARATE_SPECULAR_GLOSSINESS
    uniform sampler2D u_specularSampler;
    uniform sampler2D u_glossinessSampler;
  #else
    uniform sampler2D u_specularGlossinessSampler;
  #endif
#endif

#if defined(BASE_COLOR_MAP) || defined(NORMAL_MAP) || defined(EMISSIVE_MAP) || defined(METALLIC_ROUGHNESS_MAP) || defined(OCCLUSION_MAP) || defined(SPECULAR_GLOSSINESS_MAP) || defined(DIFFUSE_MAP)
  in vec2 v_uv;
#endif

#if defined(LIGHT)
  in vec3 v_normal;
#endif

#ifdef OCCLUSION_MAP
  uniform sampler2D u_occlusionSampler;
  uniform float u_occlusionStrength;
#endif

#ifdef EMISSIVE_MAP
  uniform sampler2D u_emissiveSampler;
  uniform vec3 u_emissiveColor;
#endif

#if defined(LIGHT) || defined(FOG) || defined(ENV_MAP)
  uniform vec3 u_eyePosition;
  in vec3 v_worldPosition;
#endif

#ifdef LIGHT
  #ifdef NORMAL_MAP
    uniform sampler2D u_normalSampler;
    uniform float u_normalScale;
    in mat3 v_TBN;
  #endif
  #ifdef IBL
    uniform samplerCube u_diffuseEnvSampler;
    uniform samplerCube u_specularEnvSampler;
    uniform sampler2D u_brdfLUTSampler;
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

#ifdef ALPHA_TEST
  uniform float u_alphaCutoff;
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
    #ifdef PBR_TYPE_METALNESS
      float metallicFactor = u_metallicFactor;
      float roughnessFactor = u_roughnessFactor;
      #if defined(METALLIC_ROUGHNESS_MAP)
        #ifdef SEPARATE_METALLIC_ROUGHNESS
          metallicFactor *= texture(u_metallicSampler, v_uv).r;
          roughnessFactor *= texture(u_roughnessSampler, v_uv).r;
        #else
          vec4 metallicRoughness = texture(u_metallicRoughnessSampler, v_uv);
          metallicFactor *= metallicRoughness.b;
          roughnessFactor *= metallicRoughness.g;
        #endif
      #endif

      roughnessFactor = clamp(roughnessFactor, c_minRoughness, 1.0);
      metallicFactor = clamp(metallicFactor, 0.0, 1.0);
      float alphaRoughness = roughnessFactor * roughnessFactor;
      float roughnessSq = alphaRoughness * alphaRoughness;

      vec4 baseColor = u_baseColorFactor;
      #if defined(BASE_COLOR_MAP)
        vec4 baseColorSamplerColor = texture(u_baseColorSampler, v_uv);
        baseColorSamplerColor.rgb = gammaInput(baseColorSamplerColor.rgb);
        #if defined(BLEND) || defined(ALPHA_TEST)
          baseColor *= baseColorSamplerColor;
        #else
          baseColor.rgb *= baseColorSamplerColor.rgb;
        #endif
      #endif
    #else
      vec4 baseColor = u_diffuseFactor;
      #if defined(DIFFUSE_MAP)
        vec4 diffuseSamplerColor = texture(u_diffuseSampler, v_uv);
        diffuseSamplerColor.rgb = gammaInput(diffuseSamplerColor.rgb);
        #if defined(BLEND) || defined(ALPHA_TEST)
          baseColor *= diffuseSamplerColor;
        #else
          baseColor.rgb *= diffuseSamplerColor.rgb;
        #endif
      #endif
    #endif

    #ifdef VERTEX_COLOR
      baseColor *= v_color;
    #endif

    baseColor.a *= u_transparency;

    #ifdef ALPHA_TEST
      if (baseColor.a < u_alphaCutoff) {
        discard;
      }
      baseColor.a = 1.0;
    #endif

    #ifdef LIGHT
      #ifdef PBR_TYPE_METALNESS
        vec3 f0 = vec3(0.04);
        vec3 diffuseColor = baseColor.rgb * (vec3(1.0) - f0);
        diffuseColor *= 1.0 - metallicFactor;
        vec3 specularColor = mix(f0, baseColor.rgb, metallicFactor);
        float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);
      #else
        vec3 specularFactor = u_specularFactor;
        float glossinessFactor = u_glossinessFactor;
        #if defined(SPECULAR_GLOSSINESS_MAP)
          #ifdef SEPARATE_SPECULAR_GLOSSINESS
            specularFactor *= gammaInput(texture(u_specularSampler, v_uv).rgb);
            glossinessFactor *= texture(u_glossinessSampler, v_uv).r;
          #else
            vec4 specularGlossinessColor = texture(u_specularGlossinessSampler, v_uv);
            specularFactor *= gammaInput(specularGlossinessColor.rgb);
            glossinessFactor *= specularGlossinessColor.a;
          #endif
        #endif

        vec3 specularColor = specularFactor;
        // Compute reflectance.
        float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);
        vec3 diffuseColor = baseColor.rgb * (1.0 - reflectance);
        float roughnessFactor = clamp(1.0 - glossinessFactor, 0.04, 1.0);
        float alphaRoughness = roughnessFactor * roughnessFactor;
        float roughnessSq = alphaRoughness * alphaRoughness;
      #endif

      // For typical incident reflectance range (between 4% to 100%) set the grazing reflectance to 100% for typical fresnel effect.
      // For very low reflectance range on highly diffuse objects (below 4%), incrementally reduce grazing reflecance to 0%.
      float reflectance90 = clamp(reflectance * 25.0, 0.0, 1.0);
      vec3 specularEnvironmentR0 = specularColor.rgb;
      vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0) * reflectance90;

      #ifdef NORMAL_MAP
        vec3 normalSampler = (texture(u_normalSampler, v_uv) * 2.0 - 1.0).rgb;
        vec3 n = normalize(normalSampler * vec3(u_normalScale, u_normalScale, 1.0));
        n = normalize(v_TBN * n);
      #else
        vec3 n = normalize(v_normal);
      #endif

      if (!gl_FrontFacing) {
        n = -n;
      }

      vec3 v = normalize(eyeSpacePosition);
      vec3 reflection = -normalize(reflect(v, n));
      float NdotV = clamp(abs(dot(n, v)), 0.001, 1.0);

      vec3 diffuseBase = vec3(0.0);
      vec3 specularBase = vec3(0.0);

      #if DIRECTION_LIGHT_COUNT
        for (int i = 0; i < DIRECTION_LIGHT_COUNT; i++) {
          DirectionLight light = u_directionLights[i];
          LightInfo info = calculateDirectionLightInfo(light, v, n, NdotV,
            specularEnvironmentR0, specularEnvironmentR90, roughnessSq);
          diffuseBase += info.diffuseColor;
          specularBase += info.specularColor;
        }
      #endif
      
      #if POINT_LIGHT_COUNT
        for (int i = 0; i < POINT_LIGHT_COUNT; i++) {
          PointLight light = u_pointLights[i];
          LightInfo info = calculatePointLightInfo(light, v, n, NdotV,
            specularEnvironmentR0, specularEnvironmentR90, roughnessSq);
          diffuseBase += info.diffuseColor;
          specularBase += info.specularColor;
        }
      #endif
      
      #if SPOT_LIGHT_COUNT
        for (int i = 0; i < SPOT_LIGHT_COUNT; i++) {
          SpotLight light = u_spotLights[i];
          LightInfo info = calculateSpotLightInfo(light, v, n, NdotV,
            specularEnvironmentR0, specularEnvironmentR90, roughnessSq);
          diffuseBase += info.diffuseColor;
          specularBase += info.specularColor;
        }
      #endif

      // Calculation of analytical lighting contribution
      vec3 diffuseContrib = diffuseBase * diffuseColor / M_PI;
      vec3 specContrib = specularBase / (4.0 * NdotV);
      vec3 color = diffuseContrib + specContrib;

      // Calculate lighting contribution from image based lighting source (IBL)
      #ifdef IBL
        vec3 brdf = gammaInput(texture(u_brdfLUTSampler, vec2(NdotV, 1.0 - roughnessFactor)).rgb);
        brdf = gammaInput(brdf);
        vec3 diffuseLight = texture(u_diffuseEnvSampler, n).rgb;
        diffuseLight = gammaInput(diffuseLight);

        float mipCount = 9.0; // resolution of 512x512
        float lod = (roughnessFactor * mipCount);
        vec3 specularLight = textureLod(u_specularEnvSampler, reflection, lod).rgb;
        specularLight = gammaInput(specularLight);

        vec3 diffuse = diffuseLight * diffuseColor;
        vec3 specular = specularLight * (specularColor * brdf.x + brdf.y);

        color += diffuse + specular;
      #endif
    #else
      vec3 color = baseColor.rgb;
    #endif

    #ifdef OCCLUSION_MAP
      float ao = texture(u_occlusionSampler, v_uv).r;
      color = mix(color, color * ao, u_occlusionStrength);
    #endif

    #ifdef EMISSIVE_MAP
      vec3 emissive = gammaInput(texture(u_emissiveSampler, v_uv).rgb) * u_emissiveColor;
      color += emissive;
    #endif

    color = tonemapACES(color);

    #ifdef WIREFRAME
      fragColor = mix(vec4(u_wireframeColor, u_transparency), gammaOutput(color), edgeFactor());
    #else
      fragColor = vec4(gammaOutput(color), baseColor.a);
    #endif
  #endif

  #ifdef FOG
    float distance = length(eyeSpacePosition);
    float fogFactor = clamp((distance - u_fogNear) / (u_fogFar - u_fogNear), 0.0, 1.0);
    fragColor.rgb = mix(fragColor.rgb, u_fogColor, fogFactor);
  #endif
}
