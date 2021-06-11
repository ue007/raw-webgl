import { GUI } from 'dat.gui';
import { vec3, vec4 } from 'gl-matrix';
import { GLUtil } from './utils/gl';
import Model from './model/Model';
import Trigger from './base/trigger';
import { WebGLAPI } from './utils/webglAPI';
import { GLContext } from './gl/Context';

/**
 * 渲染主场景
 */
export class Render extends Trigger<Render> {
  // 🖼️ Canvas
  private _canvas: HTMLCanvasElement;
  private _canvasOrId: HTMLCanvasElement | string;

  // ⚙️ API Data Structures
  private _gl: GLContext;

  // 🎞️ Frame Backings
  private _animationHandler: number;
  private _dirty: boolean;

  private _vertModule: WebGLShader;
  private _fragModule: WebGLShader;
  private _program: WebGLProgram;
  private _programs: Object;
  private _uniforms: Object;

  private _model: Model;

  private _gui: GUI;
  private _ambientColor: vec3;
  private _clearColor: vec4;
  private _viewport: Object;

  constructor(canvasOrId: HTMLCanvasElement | string, options?: Object) {
    super();
    this._canvasOrId = canvasOrId;
    // ⚪ Initialization
    this._canvas = GLUtil.getCanvas(this._canvasOrId);
    this._canvas.width = this._canvas.height = 640;

    this._model = new Model();
    this._model.on(
      'all',
      (e) => {
        console.log(e);
      },
      self
    );

    this._programs = {};
    this._uniforms = {};

    this._ambientColor = vec3.fromValues(0.1, 0.1, 0.1);
    this._clearColor = vec4.fromValues(0, 0, 0, 1);
    this._viewport = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };

    // 🌟 Initialize WebGL  直接支持webgl 2.0
    const gl: GLContext = GLUtil.getContext(this._canvas, 'webgl2', {
      alpha: false,
      depth: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
      antialias: false,
      stencil: false,
    });
    if (!gl) {
      // This rendering engine failed to start...
      throw new Error('WebGL failed to initialize.');
    }
    this._gl = gl;

    // ⚫ Set the default clear color when calling `gl.clear`
    gl.clearColor(0.5, 0.5, 0.5, 1.0);
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

    this.initGUI();
    this.start();
  }

  private initGUI() {
    const gui = new GUI();
    gui.open();

    this._gui = gui;

    // Render
    let folder_webgl = gui.addFolder('Render');
    folder_webgl.open();
    folder_webgl
      .addColor(WebGLAPI, 'clearColor')
      .listen()
      .onChange((value) => {
        let clearColor = value;
        let r = clearColor[0] / 255.0;
        let g = clearColor[1] / 255.0;
        let b = clearColor[2] / 255.0;
        this._gl && this._gl.clearColor(r, g, b, 1.0);
      });
  }

  public start() {
    this.draw();
  }

  // 🔺 Render triangle
  private draw() {
    let gl = this._gl;

    // 🖌️ Encode drawing commands
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this._program);
    gl.viewport(0, 0, this._canvas.width, this._canvas.height);
    gl.scissor(0, 0, this._canvas.width, this._canvas.height);

    this._draw();

    // ➿ Refresh canvas
    this._animationHandler = requestAnimationFrame(() => this.draw());
  }

  private _draw() {
    /*  this._model.forEach((m) => {
      if (m.vao) {
        m.vao.draw(this._gl);
      }
    }); */
    console.log('draw objects');
  }

  // 💥 Destroy Buffers, Shaders, Programs
  public destroy() {
    var gl = this._gl,
      model = this._model;

    /* model.forEach((m) => {
      gl.deleteBuffer(m._vertexBuffer);
      gl.deleteBuffer(m._colorBuffer);
      gl.deleteBuffer(m._indexBuffer);
    }); */

    gl.deleteShader(this._vertModule);
    gl.deleteShader(this._fragModule);
    gl.deleteProgram(this._program);
  }

  // 🛑 Stop the renderer from refreshing, destroy resources
  public stop() {
    cancelAnimationFrame(this._animationHandler);
    this.destroy();
  }

  /**
   * set model
   */
  public set model(m: Model) {
    this._model = m;
  }

  /**
   * get model
   */
  public get model(): Model {
    return this._model;
  }
}
