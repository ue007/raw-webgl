#include <vertex_color_define_frag>

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

#include <world_position_define_frag>

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

  #include <shadow_define_frag>

  #include <light_default_define_frag>
#endif

#include <wireframe_define_frag>

#include <clipplane_define_frag>

#include <fog_define_frag>

#include <util_frag>

uniform vec4 u_diffuseColor;
uniform float u_transparency;
out vec4 fragColor;

void main () {
  #include <clipplane_frag>

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

    #include <vertex_color_frag>

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

      #include <light_default_frag>

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

  #include <fog_frag>
}
