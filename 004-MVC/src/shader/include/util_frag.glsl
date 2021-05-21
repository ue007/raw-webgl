const vec3 gammaValue = vec3(2.2);
const vec3 gammaInvValue = vec3(1.0 / 2.2);

vec3 gammaInput (vec3 color) {
  #ifdef GAMMA_INPUT
    return pow(color, gammaValue);
  #else
    return color;
  #endif
}

vec3 gammaOutput (vec3 color) {
  return pow(color, gammaInvValue);
}

// https://github.com/google/filament/blob/b3d758f3b3fdf91b750a7561a1c729649cf4c1e8/shaders/src/common_graphics.fs
float luminance(const vec3 linear) {
  return dot(linear, vec3(0.2126, 0.7152, 0.0722));
}

// https://github.com/google/filament/blob/b3d758f3b3fdf91b750a7561a1c729649cf4c1e8/shaders/src/tone_mapping.fs
vec3 tonemapACES(const vec3 x) {
  // Narkowicz 2015, "ACES Filmic Tone Mapping Curve"
  const float a = 2.51;
  const float b = 0.03;
  const float c = 2.43;
  const float d = 0.59;
  const float e = 0.14;
  return (x * (a * x + b)) / (x * (c * x + d) + e);
}
