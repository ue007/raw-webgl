// uniform sampler2D u_sampler;
// in vec2 v_uv;
out vec4 fragColor;

void main() {
  fragColor = vec4(0.0, 0.0, 1.0, 0.5);
  // fragColor = texture(u_sampler, v_uv);
}
