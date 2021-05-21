import { GUI } from 'dat.gui';
import { GLUtil } from './gl';
import Model from './model/Model';
import Trigger from './trigger';
import { WebGLAPI } from './webglAPI';

export class Scene extends Trigger<Scene> {
  // 🖼️ Canvas
  private _canvas: HTMLCanvasElement;
  private _canvasOrId: HTMLCanvasElement | string;

  // ⚙️ API Data Structures
  private _gl: WebGL2RenderingContext;

  // 🎞️ Frame Backings
  private _animationHandler: number;
  private _dirty: boolean;

  private _vertModule: WebGLShader;
  private _fragModule: WebGLShader;
  private _program: WebGLProgram;

  private _model: Model;

  private _gui: GUI;

  constructor(canvasOrId: HTMLCanvasElement | string, options?: Object) {
    super();
    this._canvasOrId = canvasOrId;
    this.initializeWebGL();
    this.initGUI();
    this.start();
  }

  /**
   * 🌟 Initialize WebGL
   **/
  initializeWebGL() {
    // ⚪ Initialization
    this._canvas = GLUtil.getCanvas(this._canvasOrId);
    this._canvas.width = this._canvas.height = 640;

    const gl: WebGL2RenderingContext = GLUtil.getContext(this._canvas, true); // 直接支持webgl 2.0
    if (!gl) {
      // This rendering engine failed to start...
      throw new Error('WebGL failed to initialize.');
    }
    this._gl = gl;

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

  initGUI() {
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

  start() {
    this.render();
  }

  // 🔺 Render triangle
  render = () => {
    var gl = this._gl;

    // 🖌️ Encode drawing commands
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this._program);
    gl.viewport(0, 0, this._canvas.width, this._canvas.height);
    gl.scissor(0, 0, this._canvas.width, this._canvas.height);

    this._model &&
      this._model.forEach((m) => {
        // 以给定的形式绘制图形
        // m.draw(gl);
      });

    // ➿ Refresh canvas
    this._animationHandler = requestAnimationFrame(this.render);
  };

  // 💥 Destroy Buffers, Shaders, Programs
  destroyResources() {
    var gl = this._gl,
      model = this._model;

    model.forEach((m) => {
      gl.deleteBuffer(m._vertexBuffer);
      gl.deleteBuffer(m._colorBuffer);
      gl.deleteBuffer(m._indexBuffer);
    });

    gl.deleteShader(this._vertModule);
    gl.deleteShader(this._fragModule);
    gl.deleteProgram(this._program);
  }

  // 🛑 Stop the renderer from refreshing, destroy resources
  stop() {
    cancelAnimationFrame(this._animationHandler);
    this.destroyResources();
  }

  /**
   *
   * @param model
   * @returns
   */
  bind(model: Model) {
    this._model = model;

    let gl = this._gl;
    if (!gl) return;

    this._model.forEach((m) => {
      // m.createBuffer(this._gl, this._program);
    }, this);
  }
}
