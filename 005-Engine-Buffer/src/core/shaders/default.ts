// 🕸️ Vertex Shader Source
export const vertShaderCode = `
attribute vec3 a_vertex;
attribute vec3 a_color;
attribute float a_pointsize;
varying vec3 v_color;

void main()
{
    v_color = a_color;
    gl_PointSize = a_pointsize;
    gl_Position = vec4(a_vertex, 1.0);
}
`;

// 🟦 Fragment Shader Source
export const fragShaderCode = `
precision mediump float;

varying highp vec3 v_color;

void main()
{
    gl_FragColor = vec4(v_color, 1.0);
}
`;
