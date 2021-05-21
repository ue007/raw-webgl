#ifdef MORPH_TARGETS
  #if MORPH_TARGETS_COUNT > 0
    in vec3 a_position0;
  #endif
  #if MORPH_TARGETS_COUNT > 1
    in vec3 a_position1;
  #endif
  #if MORPH_TARGETS_COUNT > 2
    in vec3 a_position2;
  #endif
  #if MORPH_TARGETS_COUNT > 3
    in vec3 a_position3;
  #endif
  uniform float u_weights[MORPH_TARGETS_COUNT];
#endif

#ifdef SKIN
  in vec4 a_joint;
  in vec4 a_weight;
  uniform mat4 u_jointMatrix[SKIN_JOINTS_COUNT];
#endif

#if defined(LIGHT)
  in vec3 a_normal;
  #ifdef MORPH_TARGETS
    #if MORPH_TARGETS_COUNT > 0
      in vec3 a_normal0;
    #endif
    #if MORPH_TARGETS_COUNT > 1
      in vec3 a_normal1;
    #endif
    #if MORPH_TARGETS_COUNT > 2
      in vec3 a_normal2;
    #endif
    #if MORPH_TARGETS_COUNT > 3
      in vec3 a_normal3;
    #endif
  #endif
  uniform mat3 u_normalMatrix;
  out vec3 v_normal;
#endif

#if defined(NORMAL_MAP)
  in vec4 a_tangent;
  out mat3 v_TBN;
  #ifdef MORPH_TARGETS
    #if MORPH_TARGETS_COUNT > 0
      in vec4 a_tangent0;
    #endif
    #if MORPH_TARGETS_COUNT > 1
      in vec4 a_tangent1;
    #endif
    #if MORPH_TARGETS_COUNT > 2
      in vec4 a_tangent2;
    #endif
    #if MORPH_TARGETS_COUNT > 3
      in vec4 a_tangent3;
    #endif
  #endif
#endif

#if defined(BASE_COLOR_MAP) || defined(NORMAL_MAP) || defined(EMISSIVE_MAP) || defined(METALLIC_ROUGHNESS_MAP) || defined(OCCLUSION_MAP) || defined(SPECULAR_MAP)
  in vec2 a_uv;
  uniform mat3 u_textureMatrix;
  out vec2 v_uv;
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

  #ifdef MORPH_TARGETS
    #if MORPH_TARGETS_COUNT > 0
      position += a_position0 * u_weights[0];
    #endif
    #if MORPH_TARGETS_COUNT > 1
      position += a_position1 * u_weights[1];
    #endif
    #if MORPH_TARGETS_COUNT > 2
      position += a_position2 * u_weights[2];
    #endif
    #if MORPH_TARGETS_COUNT > 3
      position += a_position3 * u_weights[3];
    #endif
  #endif

  vec4 finalPosition = vec4(position, 1.0);

  #ifdef SKIN
    mat4 skinMat =
      a_weight.x * u_jointMatrix[int(a_joint.x)] +
      a_weight.y * u_jointMatrix[int(a_joint.y)] +
      a_weight.z * u_jointMatrix[int(a_joint.z)] +
      a_weight.w * u_jointMatrix[int(a_joint.w)];
    finalPosition = skinMat * finalPosition;
  #endif

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
    #ifdef MORPH_TARGETS
      #if MORPH_TARGETS_COUNT > 0
        finalNormal += a_normal0 * u_weights[0];
      #endif
      #if MORPH_TARGETS_COUNT > 1
        finalNormal += a_normal1 * u_weights[1];
      #endif
      #if MORPH_TARGETS_COUNT > 2
        finalNormal += a_normal2 * u_weights[2];
      #endif
      #if MORPH_TARGETS_COUNT > 3
        finalNormal += a_normal3 * u_weights[3];
      #endif
    #endif
    v_normal = u_normalMatrix * finalNormal;
  #endif

  #if defined(NORMAL_MAP)
    vec4 finalTangent = a_tangent;
    #ifdef MORPH_TARGETS
      #if MORPH_TARGETS_COUNT > 0
        finalTangent += a_tangent0 * u_weights[0];
      #endif
      #if MORPH_TARGETS_COUNT > 1
        finalTangent += a_tangent1 * u_weights[1];
      #endif
      #if MORPH_TARGETS_COUNT > 2
        finalTangent += a_tangent2 * u_weights[2];
      #endif
      #if MORPH_TARGETS_COUNT > 3
        finalTangent += a_tangent3 * u_weights[3];
      #endif
    #endif
    vec3 normal = normalize(finalNormal);
    vec3 tangent = normalize(finalTangent.xyz);
    vec3 bitangent = cross(normal, tangent) * finalTangent.w;
    v_TBN = mat3(u_modelMatrix) * mat3(tangent, bitangent, normal);
  #endif

  #if defined(BASE_COLOR_MAP) || defined(NORMAL_MAP) || defined(EMISSIVE_MAP) || defined(METALLIC_ROUGHNESS_MAP) || defined(OCCLUSION_MAP) || defined(SPECULAR_MAP)
    #ifdef FLIP_Y
      v_uv = (u_textureMatrix * vec3(a_uv.x, 1.0 - a_uv.y, 1.0)).xy;
    #else
      v_uv = (u_textureMatrix * vec3(a_uv, 1.0)).xy;
    #endif
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
