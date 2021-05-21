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

#include <vertex_color_define_frag>

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

#include <uv_defined_begin>
  in vec2 v_uv;
#include <uv_defined_end>

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

#include <world_position_define_frag>

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

  #include <shadow_define_frag>

  #include <light_pbr_define_frag>
#endif

#include <wireframe_define_frag>

#include <clipplane_define_frag>

#include <fog_define_frag>

#include <alpha_test_define_frag>

#include <util_frag>
out vec4 fragColor;

void main () {
  #include <clipplane_frag>

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

    #include <vertex_color_frag>

    baseColor.a *= u_transparency;

    #include <alpha_test_frag>

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

      #include <light_pbr_frag>

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

  #include <fog_frag>
}
