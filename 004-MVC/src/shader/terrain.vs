in vec3 a_normal;

#if defined(NORMAL_MAP1) || defined(NORMAL_MAP2) || defined(NORMAL_MAP3)
  in vec4 a_tangent;
  out mat3 v_TBN;
#endif

#if defined(MIX_MAP) || defined(DIFFUSE_MAP1) || defined(DIFFUSE_MAP2) || defined(DIFFUSE_MAP3) || defined(NORMAL_MAP1) || defined(NORMAL_MAP2) || defined(NORMAL_MAP3)
  in vec2 a_uv;
  out vec2 v_uv;
#endif

#if defined(LIGHT)
  uniform mat3 u_normalMatrix;
  out vec3 v_normal;
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
  vec4 finalPosition = vec4(position, 1.0);
  vec4 worldPosition = u_modelMatrix * finalPosition;
  gl_Position = u_projectViewMatrix * worldPosition;

  #include <world_position_vert>

  #include <shadow_vert>

  #if defined(LIGHT)
    vec3 finalNormal = a_normal;
    v_normal = u_normalMatrix * finalNormal;
  #endif

  #if defined(NORMAL_MAP1) || defined(NORMAL_MAP2) || defined(NORMAL_MAP3)
    vec4 finalTangent = a_tangent;
    #include <normal_map_vert>
  #endif

  #if defined(MIX_MAP) || defined(DIFFUSE_MAP1) || defined(DIFFUSE_MAP2) || defined(DIFFUSE_MAP3) || defined(NORMAL_MAP1) || defined(NORMAL_MAP2) || defined(NORMAL_MAP3)
    v_uv = a_uv;
  #endif

  #include <vertex_color_vert>

  #include <wireframe_vert>

  #include <clipplane_vert>
}
