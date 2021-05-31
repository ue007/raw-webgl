type BufferType = {
  usage?: number; // A GLenum specifying the intended usage pattern of the data store for optimization purposes.
  size?: number; // A GLsizeiptr setting the size in bytes of the buffer object's data store.
  stride?: number;
  name?: string; // attribute name
  buffer?: WebGLBuffer;
  data?: Array<number>;
};

let COUNT = 0;
export default class Buffer {
  _gl: WebGLRenderingContext | WebGL2RenderingContext;
  _usage: number;
  _stride;
  size: number;
  name: string;
  buffer: WebGLBuffer;
  data: Array<number>;
  count: number;
  instanceCount: number;
  TYPE: number;
  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    options: BufferType
  ) {
    COUNT++;
    console.log(COUNT);

    this._gl = gl;

    // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferData
    this._usage = gl[options.usage || 'STATIC_DRAW'];
    this.size = options.size;
    this._stride = options.stride || 0;
    this.name = options.name;

    if (this.name === 'position' && !this.size) {
      this.size = 3;
    }
    this.buffer = options.buffer || gl.createBuffer();
    if (!options.buffer && options.data) {
      this.bindData(options.data);
    }
    this.data = options.data;
  }

  bindData(data) {
    let gl = this._gl;

    if (this.name === 'position') {
      if (this._stride) {
        this.count = data.length / this._stride;
      } else {
        this.count = data.length / this.size;
      }
    }
    if (this.name === 'offset') {
      this.instanceCount = data.length / 16;
    }
    gl.bindBuffer(this.TYPE, this.buffer);
    gl.bufferData(this.TYPE, data, this._usage);
    this.data = data;
  }

  dispose() {
    this._gl.deleteBuffer(this.buffer);
    this.buffer = null;
    this._gl = null;
    COUNT--;
  }
}

Buffer.prototype.TYPE = WebGLRenderingContext.ARRAY_BUFFER;
