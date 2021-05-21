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