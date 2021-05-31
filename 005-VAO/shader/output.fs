uniform sampler2D u_sampler;

// uniform highp sampler2DArray u_sampler;
// uniform float u_layer;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  fragColor = texture(u_sampler, v_uv);

  // vec4 color = texture(u_sampler, vec3(v_uv, u_layer));
  // fragColor = vec4(color.r, color.r, color.r, 1.0);
}
