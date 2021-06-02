import { IndexBuffer } from 'src/core/gl/IndexBuffer';
import { default as Buffer } from '../core/gl/Buffer';

/* Step1: Prepare the canvas and get WebGL context */

let canvas = document.getElementById('canvas');
let gl = canvas.getContext('webgl2');

/* Step2: Define the geometry and store it in buffer objects */

// vao
let vao = gl.createVertexArray();
gl.bindVertexArray(vao);

// 使用Buffer替换
let buffers = {
  vertices: new Buffer(gl, {
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

// Vertex shader source code
let vertCode =
  'attribute vec3 a_position;' +
  'void main(void) {' +
  ' gl_Position = vec4(a_position, 1.0);' +
  '}';

//Create a vertex shader object
let vertShader = gl.createShader(gl.VERTEX_SHADER);

//Attach vertex shader source code
gl.shaderSource(vertShader, vertCode);

//Compile the vertex shader
gl.compileShader(vertShader);

//Fragment shader source code
let fragCode =
  'void main(void) {' + 'gl_FragColor = vec4(1.0, 0.0, 0.0, 0.6);' + '}';

// Create fragment shader object
let fragShader = gl.createShader(gl.FRAGMENT_SHADER);

// Attach fragment shader source code
gl.shaderSource(fragShader, fragCode);

// Compile the fragment shader
gl.compileShader(fragShader);

// Create a shader program object to store combined shader program
let shaderProgram = gl.createProgram();

// Attach a vertex shader
gl.attachShader(shaderProgram, vertShader);

// Attach a fragment shader
gl.attachShader(shaderProgram, fragShader);

// Link both programs
gl.linkProgram(shaderProgram);

// Use the combined shader program object
gl.useProgram(shaderProgram);

/* Step 4: Associate the shader programs to buffer objects */

//Bind vertex buffer object
// gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

buffers.vertices.bindAttribute({
  name: 'a_position',
  location: gl.getAttribLocation(shaderProgram, 'a_position'),
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
