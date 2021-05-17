import { GUI } from 'dat.gui';
import { WebGLAPI } from './webglAPI';
import { vertShaderCode, fragShaderCode } from './shader';
import Data from './data';
import { Trigger } from './trigger';
import Model from './model';
import { GLUtil } from './gl';

/*************************************************************/
export default class Renderer extends Trigger {
  // 🖼️ Canvas
  canvas: HTMLCanvasElement;
  canvasOrId: HTMLCanvasElement | string;

  // ⚙️ API Data Structures
  gl: WebGLRenderingContext | WebGL2RenderingContext;

  // 🎞️ Frame Backings
  animationHandler: number;

  vertModule: WebGLShader;
  fragModule: WebGLShader;
  program: WebGLProgram;
  data: Data;
  model: Model;
  webgl2: boolean;
  gui: GUI;

  constructor(canvasOrId: HTMLCanvasElement | string) {
    super();
    this.webgl2 = false;
    this.canvasOrId = canvasOrId;

    this.data = new Data();
    this.initializeWebGL();
    this.initializeResources();

    this.initGUI();
  }

  bind(model: Model) {
    this.model = model;

    let gl = this.gl;
    if (!gl) return;

    this.model.forEach((m) => {
      // vertex buffer
      m.verticeBuffer = GLUtil.vbo(
        this.gl,
        this.program,
        'a_vertex',
        new Float32Array(m.vertices)
      );
      m.colorBuffer = GLUtil.vbo(
        this.gl,
        this.program,
        'a_color',
        new Float32Array(m.colors)
      );
      // GLUtil.vbo(this.gl, this.program, 'a_color', m.indices);
      var a_pointsize = gl.getAttribLocation(this.program, 'a_pointsize');
      gl.vertexAttrib1f(a_pointsize, m.pointsize || 10.0);
    }, this);
  }

  bindGUI() {
    if (!this.model || !this.gui) return;
    let gui = this.gui,
      model = this.model,
      gl = this.gl,
      program = this.program;

    model.forEach((m) => {
      {
        const m_folder = gui.addFolder('Model:' + m.id);
        var folder_attributes = m_folder.addFolder('Attributes');
        folder_attributes.open();

        folder_attributes
          .add(m, 'pointSize', 0, 300, 1)
          .listen()
          .onChange(function (value) {
            m.pointSize = value;
            var a_pointsize = gl.getAttribLocation(program, 'a_pointsize');
            gl.vertexAttrib1f(a_pointsize, value);
          });

        var folder_vertices = folder_attributes.addFolder('vertices');
        folder_vertices.open();

        Object.keys(m.vertices).forEach((key) => {
          folder_vertices
            .add(m.vertices, key, -1.0, 1.0, 0.1)
            .onChange(function (value) {
              if (gl) {
                GLUtil.attribute(
                  gl,
                  m.verticeBuffer,
                  new Float32Array(m.vertices),
                  'a_position',
                  3,
                  gl.FLOAT,
                  gl.FLOAT,
                  3 * Float32Array.BYTES_PER_ELEMENT,
                  0
                );
              }
            })
            .listen();
        });

        var folder_colors = folder_attributes.addFolder('colors');
        folder_colors.open();
        Object.keys(m.colors).forEach((key) => {
          folder_colors
            .add(m.colors, key, 0.0, 1.0, 0.1)
            .onChange(function (value) {
              if (gl) {
                GLUtil.attribute(
                  gl,
                  m.colorBuffer,
                  new Float32Array(m.colors),
                  'a_color',
                  4,
                  gl.FLOAT,
                  gl.FLOAT,
                  4 * Float32Array.BYTES_PER_ELEMENT,
                  0
                );
              }
            })
            .listen();
        });
      }
    });
  }

  // 🏎️ Start the Rendering Engine
  start() {
    //
    this.render();
  }

  // 🌟 Initialize WebGL
  initializeWebGL() {
    // ⚪ Initialization
    this.canvas = GLUtil.getCanvas(this.canvasOrId);
    this.canvas.width = this.canvas.height = 640;

    const gl: WebGLRenderingContext = GLUtil.getContext(
      this.canvas,
      this.webgl2
    ); // webgl1.0
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
    this.vertModule = GLUtil.createShader(
      this.gl,
      vertShaderCode,
      this.gl.VERTEX_SHADER
    );
    this.fragModule = GLUtil.createShader(
      this.gl,
      fragShaderCode,
      this.gl.FRAGMENT_SHADER
    );

    this.program = GLUtil.createProgram(this.gl, [
      this.vertModule,
      this.fragModule,
    ]);
  }

  // 🔺 Render triangle
  render = () => {
    var gl = this.gl;

    // 🖌️ Encode drawing commands
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.scissor(0, 0, this.canvas.width, this.canvas.height);

    this.model.forEach((m) => {
      // 以给定的形式绘制图形
      if (WebGLAPI.drawArrays.enable) {
        m.draw(gl);
      }
    });

    // // create Buffer
    // this.verticeBuffer = GLUtil.createBuffer(this.gl, this.data.vertices);
    // this.colorBuffer = GLUtil.createBuffer(this.gl, this.data.colors);
    // this.indexBuffer = GLUtil.createBuffer(this.gl, this.data.indices);

    /*  // 🔣 Bind Vertex Layout
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
    } */

    // ➿ Refresh canvas
    this.animationHandler = requestAnimationFrame(this.render);
  };

  // 💥 Destroy Buffers, Shaders, Programs
  destroyResources() {
    var gl = this.gl,
      model = this.model;

    model.forEach((m) => {
      gl.deleteBuffer(m.verticeBuffer);
      gl.deleteBuffer(m.colorBuffer);
      gl.deleteBuffer(m.indexBuffer);
    });

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
    WebGLAPI.drawArrays.enable = true;
    WebGLAPI.drawArrays.count = this.data.vertices.length / 3;
    WebGLAPI.drawElements.enable = true;
    WebGLAPI.drawElements.count = this.data.vertices.length / 3;
    WebGLAPI.drawElements.mode = 'LINE_LOOP';

    const data = this.data;
    const gui = new GUI();
    gui.open();
    this.gui = gui;
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
      .add(WebGLAPI.drawArrays, 'enable')
      .listen()
      .name('DrawArrays')
      .onChange((value) => {});
    folder_webgl
      .add(WebGLAPI.drawArraysInstanced, 'enable')
      .listen()
      .name('drawArraysInstanced')
      .onChange((value) => {});
    folder_webgl
      .add(WebGLAPI.drawElements, 'enable')
      .listen()
      .name('DrawElements')
      .onChange((value) => {});
    folder_webgl
      .add(WebGLAPI.drawElementsInstanced, 'enable')
      .listen()
      .name('drawElementsInstanced')
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
