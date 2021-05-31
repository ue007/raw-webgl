uniform float u_timeDelta;
uniform sampler2D u_rgNoise;
uniform vec2 u_gravity;
uniform vec3 u_origin;
uniform float u_minTheta;
uniform float u_maxTheta;
uniform float u_minSpeed;
uniform float u_maxSpeed;

layout(location = 0) in vec3 a_position;
layout(location = 1) in float a_age;
layout(location = 2) in float a_life;
layout(location = 3) in vec2 a_velocity;

out vec3 v_position;
out float v_age;
out float v_life;
out vec2 v_velocity;

void main() {
  if (a_age >= a_life) {
    ivec2 noise_coord = ivec2(gl_VertexID % 512, gl_VertexID / 512);
    vec2 rand = texelFetch(u_rgNoise, noise_coord, 0).rg;
    float theta = u_minTheta + rand.r*(u_maxTheta - u_minTheta);
    float x = cos(theta);
    float y = sin(theta);

    v_position = u_origin;
    v_age = 0.0;
    v_life = a_life;
    v_velocity = vec2(x, y) * (u_minSpeed + rand.g * (u_maxSpeed - u_minSpeed));
  } else {
    v_position = a_position + vec3(a_velocity, 0.0) * u_timeDelta;
    v_age = a_age + u_timeDelta;
    v_life = a_life;
    v_velocity = a_velocity + u_gravity * u_timeDelta;
  }
}