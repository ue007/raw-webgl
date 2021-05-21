#include <vertex_color_define_frag>

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

#include <world_position_define_frag>

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
  
  #include <bumpmap_define_frag>

  #include <shadow_define_frag>

  #include <light_default_define_frag>
#endif

#include <wireframe_define_frag>

#include <clipplane_define_frag>

#include <fog_define_frag>

#include <alpha_test_define_frag>

#include <util_frag>

uniform vec4 u_diffuseColor;
uniform float u_transparency;
out vec4 fragColor;

void main () {
  #include <clipplane_frag>

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

    #include <vertex_color_frag>

    #include <alpha_test_frag>

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

      #include <light_default_frag>

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

  #include <fog_frag>
}
