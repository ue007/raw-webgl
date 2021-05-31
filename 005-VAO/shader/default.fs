#ifdef VERTEX_COLOR
  in vec4 v_color;
#endif

#ifdef DIFFUSE_MAP
  uniform sampler2D u_diffuseSampler;
#endif

#ifdef DIFFUSE_CUBE_MAP
  uniform samplerCube u_diffuseSampler;
#endif

#if defined(LIGHT) || defined(ENV_MAP)
  in vec3 v_normal;
#endif

#if defined(DIFFUSE_MAP) || defined(NORMAL_MAP) || defined(BUMP_MAP) || defined(EMISSIVE_MAP) || defined(AMBIENT_MAP) || defined(SPECULAR_MAP)
  in vec2 v_uv;
#endif

#ifdef ENV_MAP
  uniform samplerCube u_envSampler;
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
  uniform vec3 u_ambientLightColor;
  uniform vec3 u_ambientColor;
  uniform float u_shininess;

  #ifdef AMBIENT_MAP
    uniform sampler2D u_ambientSampler;
  #endif
  #ifdef SPECULAR_MAP
    uniform sampler2D u_specularSampler;
  #else
    uniform vec3 u_specularColor;
  #endif
  #if defined(NORMAL_MAP)
    uniform sampler2D u_normalSampler;
    in mat3 v_TBN;
  #endif
  
  #if defined(BUMP_MAP)
    uniform sampler2D u_bumpSampler;
    uniform float u_bumpScale;
  
    //Bump Mapping Unparametrized Surfaces on the GPU by Morten S. Mikkelsen
    // http://api.unrealengine.com/attachments/Engine/Rendering/LightingAndShadows/BumpMappingWithoutTangentSpace/mm_sfgrad_bump.pdf
    // https://github.com/mrdoob/three.js/blob/dev/src/renderers/shaders/ShaderChunk/bumpmap_pars_fragment.glsl
    vec3 perturbNormalArb(vec3 surf_pos, vec3 surf_norm) {
      vec2 dSTdx = dFdx(v_uv);
      vec2 dSTdy = dFdy(v_uv);
      float Hll = u_bumpScale * texture(u_bumpSampler, v_uv).x;
      float dBx = u_bumpScale * texture(u_bumpSampler, v_uv + dSTdx).x - Hll;
      float dBy = u_bumpScale * texture(u_bumpSampler, v_uv + dSTdy).x - Hll;
  
      vec3 vSigmaX = vec3(dFdx(surf_pos.x), dFdx(surf_pos.y), dFdx(surf_pos.z));
      vec3 vSigmaY = vec3(dFdy(surf_pos.x), dFdy(surf_pos.y), dFdy(surf_pos.z));
      vec3 vN = surf_norm;
      vec3 R1 = cross(vSigmaY, vN);
      vec3 R2 = cross(vN, vSigmaX);
  
      float fDet = dot(vSigmaX, R1);
      fDet *= (float(gl_FrontFacing) * 2.0 - 1.0);
  
      vec3 vGrad = sign(fDet) * (dBx * R1 + dBy * R2);
      return normalize(abs(fDet) * surf_norm - vGrad);
    }
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

  #if defined(LIGHT) || defined(FOG) || defined(ENV_MAP)
    vec3 eyeSpacePosition = u_eyePosition - v_worldPosition;
  #endif

  #if defined(WIREFRAME) && defined(WIREFRAME_ONLY)
    fragColor = vec4(u_wireframeColor, (1.0 - edgeFactor()) * u_transparency);
  #else
    #ifdef DIFFUSE_MAP
      vec4 baseColor = texture(u_diffuseSampler, v_uv);
      baseColor.rgb = gammaInput(baseColor.rgb);
    #else
      #ifdef DIFFUSE_CUBE_MAP
        // http://marcinignac.com/blog/pragmatic-pbr-hdr/
        vec4 baseColor = texture(u_diffuseSampler, normalize(vec3(-v_modelPosition.x, v_modelPosition.y, v_modelPosition.z)));
        baseColor.rgb = gammaInput(baseColor.rgb);
      #else
        vec4 baseColor = vec4(1.0);
      #endif
    #endif

    #ifdef VERTEX_COLOR
      baseColor *= v_color;
    #endif

    #ifdef ALPHA_TEST
      if (baseColor.a < u_alphaCutoff) {
        discard;
      }
      baseColor.a = 1.0;
    #endif

    baseColor.a *= u_transparency;

    vec3 emissiveColor = vec3(0.0);
    #ifdef EMISSIVE_MAP
      emissiveColor = u_emissiveColor * texture(u_emissiveSampler, v_uv).rgb;
    #endif

    #ifdef LIGHT
      #if defined(NORMAL_MAP)
        vec3 normal = normalize((texture(u_normalSampler, v_uv) * 2.0 - 1.0).rgb);
        normal = normalize(v_TBN * normal);
      #else
        #if defined(BUMP_MAP)
          vec3 normal = perturbNormalArb(v_worldPosition, normalize(v_normal));
        #else
          vec3 normal = normalize(v_normal);
        #endif
      #endif

      if (!gl_FrontFacing) {
        normal = -normal;
      }

      vec3 diffuseBase = vec3(0.0);
      vec3 specularBase = vec3(0.0);
      // DEBUG:
      // vec3 cascadedColor = vec3(0.0);
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

      #ifdef AMBIENT_MAP
        vec3 ambientSamplerColor = texture(u_ambientSampler, v_uv).rgb;
      #else
        vec3 ambientSamplerColor = vec3(1.0);
      #endif

      #ifdef SPECULAR_MAP
        vec3 specularMaterialColor = texture(u_specularSampler, v_uv).rgb;
      #else
        vec3 specularMaterialColor = u_specularColor;
      #endif

      diffuseBase += u_ambientColor * u_ambientLightColor;
      diffuseBase *= u_diffuseColor.rgb;
      // DEBUG:
      // diffuseBase += cascadedColor;
      specularBase *= specularMaterialColor;
      vec3 finalColor = diffuseBase;
      finalColor *= baseColor.rgb * ambientSamplerColor;
      finalColor += emissiveColor + specularBase;
      baseColor = vec4(finalColor, u_diffuseColor.a * baseColor.a);
    #else
      baseColor = vec4(u_diffuseColor.rgb * baseColor.rgb + emissiveColor, u_diffuseColor.a * baseColor.a);
    #endif

    #ifdef ENV_MAP
      #ifdef REFRACTIVE
        vec3 R = refract(-normalize(eyeSpacePosition), normal, 1.0 / 1.52);
      #else
        vec3 R = reflect(-normalize(eyeSpacePosition), normal);
      #endif
      R.x = -R.x;
      // TODO Reflection Map
      baseColor.rgb = mix(baseColor.rgb, baseColor.rgb * gammaInput(texture(u_envSampler, R).rgb), 1.0);
      // baseColor.rgb = gammaInput(texture(u_envSampler, R).rgb);
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
