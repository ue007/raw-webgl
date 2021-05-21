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