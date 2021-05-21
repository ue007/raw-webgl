uniform vec3 u_outlineColor;
out vec4 fragColor;

void main() {
  fragColor = vec4(u_outlineColor, 1.0);
}