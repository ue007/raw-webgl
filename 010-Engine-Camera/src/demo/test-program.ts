import { IndexBuffer, DataBuffer, Program } from '../index';
console.log(IndexBuffer, DataBuffer, Program);

/* Step1: Prepare the canvas and get WebGL context */

let canvas = document.getElementById('canvas');
let gl = canvas.getContext('webgl2');

/* Step2: Define the geometry and store it in buffer objects */

// vao
let vao = gl.createVertexArray();
gl.bindVertexArray(vao);

// 使用Buffer替换
let buffers = {
  vertices: new DataBuffer(gl, {
    data: new Float32Array([
      -0.5, 0.5, 0.0, -0.5, -0.5, 0.0, 0.5, -0.5, 0.0, 0.5, 0.5, 0.0,
    ]),
    size: 3,
    name: 'vertices',
    stride: 3 * Float32Array.BYTES_PER_ELEMENT,
    offset: 0,
    type: gl.FLOAT,
  }),
  indices: new IndexBuffer(gl, {
    data: new Uint16Array([3, 2, 1, 3, 1, 0]),
  }),
};

// unbind the vao
gl.bindVertexArray(null);

/* Step3: Create and compile Shader programs */

const program = new Program({
  // Vertex shader source code
  vertex: `attribute vec3 a_position;
  void main(void) {
    gl_Position = vec4(a_position, 1.0);
  }`,
  // Fragment shader source code
  fragment: `void main(void) {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 0.6);
  }`,
});
program.use(gl);

/* Step 4: Associate the shader programs to buffer objects */

//Bind vertex buffer object
// gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

buffers.vertices.bindAttribute({
  name: 'a_position',
  location: gl.getAttribLocation(program.program, 'a_position'),
  type: gl.FLOAT,
  size: 3,
});

// Clear the canvas
gl.clearColor(0.5, 0.5, 0.5, 0.9);

// Enable the depth test
gl.enable(gl.DEPTH_TEST);

// Clear the color buffer bit
gl.clear(gl.COLOR_BUFFER_BIT);

// Set the view port
gl.viewport(0, 0, canvas.width, canvas.height);

// Draw the triangle
gl.drawArrays(gl.TRIANGLES, 0, 3);

// change bind to index buffer
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices.buffer);
// draw Element
gl.drawElements(
  gl.TRIANGLES,
  buffers.indices.count,
  buffers.indices.elementType,
  buffers.indices.offset
);
