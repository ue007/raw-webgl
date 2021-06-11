import {} from '../index';
// let data = new Data();
// data.on('change', (e) => {
//   console.log(e);
// });
// data.type = 'cube';
// console.log(data);
// console.log(Data, geometries, vaos);

import {
  VertexArray,
  IndexBuffer,
  DataBuffer,
  Program,
  Data,
  geometries,
  vaos,
} from '../index';
console.log(VertexArray, IndexBuffer, DataBuffer, Program);

/* Step1: Prepare the canvas and get WebGL context */

let canvas = document.getElementById('canvas');
let gl = canvas.getContext('webgl2');

/* Step2: Define the geometry and store it in buffer objects */

// vao
let data = new Data();
data.on('change', (e) => {
  console.log(e);
});
data.type = 'cube';
const vao = data.vao;
vao.bind(gl);

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

function draw() {
  // Clear the canvas
  gl.clearColor(0.5, 0.5, 0.5, 0.9);

  // Enable the depth test
  gl.enable(gl.DEPTH_TEST);

  // Clear the color buffer bit
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Set the view port
  gl.viewport(0, 0, canvas.width, canvas.height);

  // draw Element
  vao.draw(gl);

  requestAnimationFrame(() => draw());
}
draw();
