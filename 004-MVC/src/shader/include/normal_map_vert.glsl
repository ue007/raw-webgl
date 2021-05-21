vec3 normal = normalize(finalNormal);
vec3 tangent = normalize(finalTangent.xyz);
vec3 bitangent = cross(normal, tangent) * finalTangent.w;
v_TBN = mat3(u_modelMatrix) * mat3(tangent, bitangent, normal);