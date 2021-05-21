uniform vec2 u_windowSize;
uniform float u_blurAmount;
uniform float u_blurScale;
uniform float u_blurStrength;
uniform bool u_horizontal;
uniform sampler2D u_sampler;

in vec2 v_uv;
out vec4 fragColor;

const float BLUR_PASSES = 20.0;

float gaussian(float x, float deviation) {
  return (1.0 / sqrt(6.28318530718 * deviation)) * exp(-((x * x) / (2.0 * deviation)));
}

void main() {
  vec4  color     = vec4(0.0);
  float half_blur = u_blurAmount * 0.5;
  float strength  = 1.0 - u_blurStrength;
  float deviation = half_blur * 0.35;
  deviation *= deviation;

  vec2 texelOffset = u_horizontal ? vec2(u_windowSize.x, 0.0) : vec2(0.0, u_windowSize.y);

  for (float i = 0.0; i < BLUR_PASSES; i += 1.0) {
    if (i >= u_blurAmount) {
      break;
    }
    float offset = i - half_blur;
    vec4 tex_color = texture(u_sampler, v_uv +
      offset * u_blurScale * texelOffset) * gaussian(offset * strength, deviation);
    color += tex_color;
  }

  fragColor = clamp(color, 0.0, 1.0);
}