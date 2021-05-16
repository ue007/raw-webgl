import { GUI } from 'dat.gui';
import { WebGLAPI } from './webglAPI';
import { vertShaderCode, fragShaderCode } from './shader';
import Data from './data';

/*************************************************************/
export default class Renderer {
  // 🖼️ Canvas
  canvas: HTMLCanvasElement;

  // ⚙️ API Data Structures
  gl: WebGLRenderingContext;

  // 🎞️ Frame Backings
  animationHandler: number;

  // 🔺 Resources
  verticeBuffer: WebGLBuffer;
  colorBuffer: WebGLBuffer;
  indexBuffer: WebGLBuffer;
  vertModule: WebGLShader;
  fragModule: WebGLShader;
  program: WebGLProgram;
  data: Data;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.data = new Data();
    WebGLAPI.drawArrays.enable = true;
    WebGLAPI.drawArrays.count = this.data.vertices.length / 3;
    WebGLAPI.drawElements.enable = true;
    WebGLAPI.drawElements.count = this.data.vertices.length / 3;
    WebGLAPI.drawElements.mode = 'LINE_LOOP';
    this.initGUI();
  }

  // 🏎️ Start the Rendering Engine
  start() {
    this.initializeAPI();
    this.initializeResources();
    this.render();
  }

  // 🌟 Initialize WebGL
  initializeAPI() {
    // ⚪ Initialization
    var gl: WebGLRenderingContext = this.canvas.getContext('webgl');
    if (!gl) {
      // This rendering engine failed to start...
      throw new Error('WebGL failed to initialize.');
    }
    this.gl = gl;

    // Most WebGL Apps will want to enable these settings:

    // ⚫ Set the default clear color when calling `gl.clear`
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    // 🎭 Write to all channels during a clear
    gl.colorMask(true, true, true, true);
    // 👓 Test if when something is drawn, it's in front of what was drawn previously
    gl.enable(gl.DEPTH_TEST);
    // ≤ Use this function to test depth values
    gl.depthFunc(gl.LEQUAL);
    // 🌒 Hide triangles who's normals don't face the camera
    gl.cullFace(gl.BACK);
    // 🍥 Properly blend images with alpha channels
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  // 🍱 Initialize resources to render triangle (buffers, shaders, pipeline)
  initializeResources() {
    let gl = this.gl;

    // 👋 Helper function for creating WebGLBuffer(s) out of Typed Arrays
    let createBuffer = (arr) => {
      // ⚪ Create Buffer
      let buf = gl.createBuffer();
      let bufType =
        arr instanceof Uint16Array || arr instanceof Uint32Array
          ? gl.ELEMENT_ARRAY_BUFFER
          : gl.ARRAY_BUFFER;
      // 🩹 Bind Buffer to WebGLState
      gl.bindBuffer(bufType, buf);
      // 💾 Push data to VBO
      gl.bufferData(bufType, arr, gl.STATIC_DRAW);
      return buf;
    };

    this.verticeBuffer = createBuffer(this.data.vertices);
    this.colorBuffer = createBuffer(this.data.colors);
    this.indexBuffer = createBuffer(this.data.indices);

    // 👋 Helper function for creating WebGLShader(s) out of strings
    let createShader = (source: string, stage) => {
      // ⚪ Create Shader
      let s = gl.createShader(stage);
      // 📰 Pass Vertex Shader String
      gl.shaderSource(s, source);
      // 🔨 Compile Vertex Shader (and check for errors)
      gl.compileShader(s);
      // ❔ Check if shader compiled correctly
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(
          'An error occurred compiling the shader: ' + gl.getShaderInfoLog(s)
        );
      }
      return s;
    };

    this.vertModule = createShader(vertShaderCode, gl.VERTEX_SHADER);
    this.fragModule = createShader(fragShaderCode, gl.FRAGMENT_SHADER);

    // 👋 Helper function for creating WebGLProgram(s) out of WebGLShader(s)
    let createProgram = (stages: WebGLShader[]) => {
      let p = gl.createProgram();
      for (let stage of stages) {
        gl.attachShader(p, stage);
      }
      gl.linkProgram(p);
      return p;
    };

    this.program = createProgram([this.vertModule, this.fragModule]);
  }

  // 🔺 Render triangle
  render = () => {
    var gl = this.gl;

    // 🖌️ Encode drawing commands
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.scissor(0, 0, this.canvas.width, this.canvas.height);

    // 🔣 Bind Vertex Layout
    let setVertexBuffer = (buf: WebGLBuffer, name: string) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      let loc = gl.getAttribLocation(this.program, name);
      gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 4 * 3, 0);
      gl.enableVertexAttribArray(loc);
    };

    setVertexBuffer(this.verticeBuffer, 'a_vertex');
    setVertexBuffer(this.colorBuffer, 'a_color');

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

    var a_pointsize = gl.getAttribLocation(this.program, 'a_pointsize');
    gl.vertexAttrib1f(a_pointsize, WebGLAPI.pointSize || 10.0);

    // 以给定的形式绘制图形
    if (WebGLAPI.drawArrays.enable) {
      gl.drawArrays(
        gl[WebGLAPI.drawArrays.mode],
        WebGLAPI.drawArrays.first,
        WebGLAPI.drawArrays.count
      );
    }

    if (WebGLAPI.drawElements.enable) {
      // gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0);
      if (WebGLAPI.drawElements.indexArrayType === 'Uint8Array') {
        gl.drawElements(
          gl[WebGLAPI.drawElements.mode],
          WebGLAPI.drawElements.count,
          gl[WebGLAPI.drawElements.type],
          WebGLAPI.drawElements.offset * Uint8Array.BYTES_PER_ELEMENT
        );
      } else if (WebGLAPI.drawElements.indexArrayType === 'Uint16Array') {
        gl.drawElements(
          gl[WebGLAPI.drawElements.mode],
          WebGLAPI.drawElements.count,
          gl[WebGLAPI.drawElements.type],
          WebGLAPI.drawElements.offset * Uint16Array.BYTES_PER_ELEMENT
        );
      }
    }

    // ➿ Refresh canvas
    this.animationHandler = requestAnimationFrame(this.render);
  };

  // 💥 Destroy Buffers, Shaders, Programs
  destroyResources() {
    var gl = this.gl;

    gl.deleteBuffer(this.verticeBuffer);
    gl.deleteBuffer(this.colorBuffer);
    gl.deleteBuffer(this.indexBuffer);
    gl.deleteShader(this.vertModule);
    gl.deleteShader(this.fragModule);
    gl.deleteProgram(this.program);
  }

  // 🛑 Stop the renderer from refreshing, destroy resources
  stop() {
    cancelAnimationFrame(this.animationHandler);
    this.destroyResources();
  }

  initGUI() {
    const data = this.data;
    const gui = new GUI();
    gui.open();

    // Render
    var folder_webgl = gui.addFolder('Render');
    folder_webgl.open();
    folder_webgl
      .addColor(WebGLAPI, 'clearColor')
      .listen()
      .onChange((value) => {
        let clearColor = value;
        let r = clearColor[0] / 255.0;
        let g = clearColor[1] / 255.0;
        let b = clearColor[2] / 255.0;
        this.gl && this.gl.clearColor(r, g, b, 1.0);
      });
    folder_webgl
      .add(WebGLAPI, 'pointSize')
      .listen()
      .onChange((value) => {});
    folder_webgl
      .add(WebGLAPI.drawArrays, 'enable')
      .listen()
      .name('DrawArrays')
      .onChange((value) => {});
    folder_webgl
      .add(WebGLAPI.drawElements, 'enable')
      .listen()
      .name('DrawElements')
      .onChange((value) => {});

    // drawArrays
    {
      var folder_drawArrays = gui.addFolder('DrawArrays');
      folder_drawArrays.open();
      folder_drawArrays
        .add(WebGLAPI.drawArrays, 'mode', [
          'POINTS',
          'LINE_STRIP',
          'LINE_LOOP',
          'LINES',
          'TRIANGLE_STRIP',
          'TRIANGLE_FAN',
          'TRIANGLES',
        ])
        .listen();
      folder_drawArrays
        .add(WebGLAPI.drawArrays, 'first', 0, data.vertices.length / 3)
        .onChange(function (value) {
          WebGLAPI.drawArrays.count = data.vertices.length / 3 - value;
        });
      folder_drawArrays
        .add(WebGLAPI.drawArrays, 'count', -1, data.vertices.length / 3)
        .listen();
    }

    // drawElements
    {
      var folder_drawElements = gui.addFolder('DrawElements');
      folder_drawElements.open();
      folder_drawElements
        .add(WebGLAPI.drawElements, 'mode', [
          'POINTS',
          'LINE_STRIP',
          'LINE_LOOP',
          'LINES',
          'TRIANGLE_STRIP',
          'TRIANGLE_FAN',
          'TRIANGLES',
        ])
        .listen();
      folder_drawElements
        .add(WebGLAPI.drawElements, 'count', -1, data.vertices.length / 3)
        .listen();
      folder_drawElements
        .add(WebGLAPI.drawElements, 'offset', 0, data.vertices.length / 3)
        .listen();
      folder_drawElements.add(WebGLAPI.drawElements, 'type').listen();
    }
  }
}
