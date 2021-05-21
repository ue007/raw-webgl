#include <morph_define_vert>

#include <skin_define_vert>

#if defined(LIGHT)
  in vec3 a_normal;
  #include <morph_normal_define_vert>
  uniform mat3 u_normalMatrix;
  out vec3 v_normal;
#endif

#if defined(NORMAL_MAP)
  in vec4 a_tangent;
  out mat3 v_TBN;
  #include <morph_tangent_define_vert>
#endif

#if defined(BASE_COLOR_MAP) || defined(NORMAL_MAP) || defined(EMISSIVE_MAP) || defined(METALLIC_ROUGHNESS_MAP) || defined(OCCLUSION_MAP) || defined(SPECULAR_MAP)
  in vec2 a_uv;
  uniform mat3 u_textureMatrix;
  out vec2 v_uv;
#endif

#include <wireframe_define_vert>

#include <clipplane_define_vert>

#include <world_position_define_vert>

#include <vertex_color_define_vert>

#include <shadow_define_vert>

in vec3 a_position;
uniform mat4 u_projectViewMatrix;
uniform mat4 u_modelMatrix;

void main () {
  vec3 position = a_position;

  #include <morph_vert>

  vec4 finalPosition = vec4(position, 1.0);

  #include <skin_vert>

  vec4 worldPosition = u_modelMatrix * finalPosition;
  gl_Position = u_projectViewMatrix * worldPosition;

  #include <world_position_vert>

  #include <shadow_vert>

  #if defined(LIGHT)
    vec3 finalNormal = a_normal;
    #include <morph_normal_vert>
    v_normal = u_normalMatrix * finalNormal;
  #endif

  #if defined(NORMAL_MAP)
    vec4 finalTangent = a_tangent;
    #include <morph_tangent_vert>
    #include <normal_map_vert>
  #endif

  #if defined(BASE_COLOR_MAP) || defined(NORMAL_MAP) || defined(EMISSIVE_MAP) || defined(METALLIC_ROUGHNESS_MAP) || defined(OCCLUSION_MAP) || defined(SPECULAR_MAP)
    #ifdef FLIP_Y
      v_uv = (u_textureMatrix * vec3(a_uv.x, 1.0 - a_uv.y, 1.0)).xy;
    #else
      v_uv = (u_textureMatrix * vec3(a_uv, 1.0)).xy;
    #endif
  #endif

  #include <vertex_color_vert>

  #include <wireframe_vert>

  #include <clipplane_vert>
}
