uniform vec3 u_pointColor;
uniform sampler2D u_particle;

in float v_age;
in float v_life;

out vec4 fragColor;

// http://iquilezles.org/www/articles/palettes/palettes.htm
vec3 palette(in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}

void main() {
  float t =  v_age / v_life;
  vec3 color = u_pointColor;
  // color = palette(t,
  //   vec3(0.5, 0.5, 0.5),
  //   vec3(0.5, 0.5, 0.5),
  //   vec3(1.0, 1.0, 1.0),
  //   vec3(0.00, 0.10, 0.20));
  vec4 particleColor = texture(u_particle, gl_PointCoord);
  fragColor = vec4(color, 1.0 - t) * particleColor;
}