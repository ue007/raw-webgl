uniform sampler2D u_sampler;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  fragColor = texture(u_sampler, v_uv);
}