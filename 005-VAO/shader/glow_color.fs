uniform vec3 u_glowColor;
out vec4 fragColor;

void main() {
  fragColor = vec4(u_glowColor, 1.0);
}