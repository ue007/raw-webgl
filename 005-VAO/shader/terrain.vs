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

#ifdef WIREFRAME
  in vec3 a_barycentric;
  out vec3 v_barycentric;
#endif

#if defined(CLIPPLANE) || defined(DIFFUSE_CUBE_MAP)
  out vec3 v_modelPosition;
#endif

#if defined(LIGHT) || defined(FOG) || defined(ENV_MAP)
  out vec3 v_worldPosition;
#endif

#ifdef VERTEX_COLOR
  in vec4 a_color;
  out vec4 v_color;
#endif

#ifdef SHADOW
  #define CASCADED_COUNT 4
  uniform mat4 u_shadowMapProjectViewMatrix_0;
  uniform mat4 u_shadowMapProjectViewMatrix_1;
  uniform mat4 u_shadowMapProjectViewMatrix_2;
  uniform mat4 u_shadowMapProjectViewMatrix_3;
  out vec4 v_shadowMapPosition[CASCADED_COUNT];
#endif

in vec3 a_position;
uniform mat4 u_projectViewMatrix;
uniform mat4 u_modelMatrix;

void main () {
  vec3 position = a_position;
  vec4 finalPosition = vec4(position, 1.0);
  vec4 worldPosition = u_modelMatrix * finalPosition;
  gl_Position = u_projectViewMatrix * worldPosition;

  #if defined(LIGHT) || defined(FOG) || defined(ENV_MAP)
    v_worldPosition = worldPosition.xyz;
  #endif

  #ifdef SHADOW
    v_shadowMapPosition[0] = u_shadowMapProjectViewMatrix_0 * worldPosition;
    v_shadowMapPosition[1] = u_shadowMapProjectViewMatrix_1 * worldPosition;
    v_shadowMapPosition[2] = u_shadowMapProjectViewMatrix_2 * worldPosition;
    v_shadowMapPosition[3] = u_shadowMapProjectViewMatrix_3 * worldPosition;
  #endif

  #if defined(LIGHT)
    vec3 finalNormal = a_normal;
    v_normal = u_normalMatrix * finalNormal;
  #endif

  #if defined(NORMAL_MAP1) || defined(NORMAL_MAP2) || defined(NORMAL_MAP3)
    vec4 finalTangent = a_tangent;
    vec3 normal = normalize(finalNormal);
    vec3 tangent = normalize(finalTangent.xyz);
    vec3 bitangent = cross(normal, tangent) * finalTangent.w;
    v_TBN = mat3(u_modelMatrix) * mat3(tangent, bitangent, normal);
  #endif

  #if defined(MIX_MAP) || defined(DIFFUSE_MAP1) || defined(DIFFUSE_MAP2) || defined(DIFFUSE_MAP3) || defined(NORMAL_MAP1) || defined(NORMAL_MAP2) || defined(NORMAL_MAP3)
    v_uv = a_uv;
  #endif

  #ifdef VERTEX_COLOR
    v_color = a_color;
  #endif

  #ifdef WIREFRAME
    v_barycentric = a_barycentric;
  #endif

  #if defined(CLIPPLANE) || defined(DIFFUSE_CUBE_MAP)
    v_modelPosition = finalPosition.xyz;
  #endif
}
