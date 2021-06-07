export interface BufferDescriptor {
  /**
   * usage
   * A GLenum specifying the intended usage pattern of the data store for optimization purposes. Possible values:
   *  gl.STATIC_DRAW: The contents are intended to be specified once by the application, and used many times as the source for WebGL drawing and image specification commands.
   *  gl.DYNAMIC_DRAW: The contents are intended to be respecified repeatedly by the application, and used many times as the source for WebGL drawing and image specification commands.
   *  gl.STREAM_DRAW: The contents are intended to be specified once by the application, and used at most a few times as the source for WebGL drawing and image specification commands.
   * When using a WebGL 2 context, the following values are available additionally:
   *  gl.STATIC_READ: The contents are intended to be specified once by reading data from WebGL, and queried many times by the application.
   *  gl.DYNAMIC_READ: The contents are intended to be respecified repeatedly by reading data from WebGL, and queried many times by the application.
   *  gl.STREAM_READ: The contents are intended to be specified once by reading data from WebGL, and queried at most a few times by the application
   *  gl.STATIC_COPY: The contents are intended to be specified once by reading data from WebGL, and used many times as the source for WebGL drawing and image specification commands.
   *  gl.DYNAMIC_COPY: The contents are intended to be respecified repeatedly by reading data from WebGL, and used many times as the source for WebGL drawing and image specification commands.
   *  gl.STREAM_COPY: The contents are intended to be specified once by reading data from WebGL, and used at most a few times as the source for WebGL drawing and image specification commands.
   */
  usage?: GLenum;
  size?: number;
  stride?: number;
  name?: string;
  buffer?: WebGLBuffer;
  data:
    | Int8Array
    | Uint8Array
    | Uint8ClampedArray
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array; // https://devdocs.io/dom/arraybufferview
  offset?: number;
  type?: number;
}
declare type DataType = {};

/**
 * Shader中Attribute Type定义
 */
declare type AttributeType = {
  name: string;
  location: number;
  type: number;
  size: number;
};
/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLBuffer
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext#buffers
 * @example
 *  new DataBuffer(gl, {
          name: attrName,
          buffer: dataBuffer && dataBuffer.buffer,
          data,
          stride: bufferData.stride,
          offset: bufferData.offset,
          type: bufferData.type,
          size: bufferData.size,
          usage: bufferData.usage,
        }));
 * @todo
 * WebGLRenderingContext.getBufferParameter()
 * Returns information about the buffer.
 * WebGLRenderingContext.isBuffer()
 * Returns a Boolean indicating if the passed buffer is valid.
 */
export default class Buffer {
  private _gl: WebGL2RenderingContext;
  private static COUNT: number = 0;
  protected static TYPE: number = WebGLRenderingContext.ARRAY_BUFFER;
  private _usage: GLenum;
  private _size: number = 0;
  private _stride: number = 0;
  private _name: string;
  private _buffer: WebGLBuffer;
  private _offset: number;
  private _data:
    | Int8Array
    | Uint8Array
    | Uint8ClampedArray
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array;
  protected _count: number;
  private _instanceCount: number;
  private _type: number;

  constructor(gl: WebGL2RenderingContext, options: BufferDescriptor) {
    this._gl = gl;
    Buffer.COUNT++;

    // bufferData parameters
    this._usage = gl.STATIC_DRAW;
    this._size = options.size;
    this._stride = options.stride;
    this._name = options.name;
    this._offset = options.offset || 0;

    if (this._name === 'vertices' && !this._size) {
      this._size = 3;
    }

    // create buffer
    this._buffer = options.buffer || this.create();

    // bind buffer data
    if (!options.buffer && options.data) {
      this.bindData(options.data);
    }

    // cache data
    this._data = options.data;
    this._offset = options.offset || 0;

    this._type = options.type || gl.FLOAT;

    if (this._name === 'vertices') {
      if (this._stride) {
        this._count = options.data.length / this._stride;
      } else {
        this._count = options.data.length / this._size;
      }
    }
    if (this._name === 'offset') {
      this._instanceCount = options.data.length / 16;
    }
  }

  /**
   * Creates a WebGLBuffer object.
   */
  private create(): WebGLBuffer {
    return this._gl.createBuffer();
  }

  /**
   * bind buffer and buffer data
   * @param data
   * @see https://devdocs.io/dom/arraybufferview
   * @see https://devdocs.io/dom/webglrenderingcontext/bufferdata
   */
  public bindData(
    data:
      | Int8Array
      | Uint8Array
      | Uint8ClampedArray
      | Int16Array
      | Uint16Array
      | Int32Array
      | Uint32Array
      | Float32Array
      | Float64Array
  ) {
    let gl = this._gl;
    if (this._name === 'vertices') {
      if (this._stride) {
        this._count = data.length / this._stride;
      } else {
        this._count = data.length / this._size;
      }
    }

    // instance data
    if (this._name === 'offset') {
      this._instanceCount = data.length / 16;
    }
    // Binds a WebGLBuffer object to a given target.
    gl.bindBuffer(Buffer.TYPE, this._buffer);
    // Updates buffer data.
    gl.bufferData(Buffer.TYPE, data, this._usage);

    // @todo
    // WebGLRenderingContext.bufferSubData()
    // Updates buffer data starting at a passed offset.

    // cache data
    this._data = data;
  }

  /**
   *
   * @param attribute
   * @see https://devdocs.io/dom/webgl2renderingcontext/vertexattribipointer
   */
  public bindAttribute(attribute: AttributeType) {
    let gl = this._gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this._buffer);

    if (attribute.size > 4) {
      // https://stackoverflow.com/questions/38853096/webgl-how-to-bind-values-to-a-mat4-attribute
      for (
        let i = 0, attributeCount = attribute.size / 4;
        i < attributeCount;
        i++
      ) {
        gl.enableVertexAttribArray(attribute.location + i);
        gl.vertexAttribPointer(
          attribute.location + i,
          4,
          gl.FLOAT,
          false,
          4 * attribute.size,
          16 * i
        );
        if (attribute.name === 'offset') {
          gl.vertexAttribDivisor(attribute.location + i, 1);
        }
      }
    } else {
      gl.enableVertexAttribArray(attribute.location);
      // index, size, type, normalized, stride, offset
      gl.vertexAttribPointer(
        attribute.location,
        this._size || attribute.size,
        this._type,
        false,
        this._stride,
        this._offset
      );
      if (attribute.name === 'offset') {
        gl.vertexAttribDivisor(attribute.location, 1);
      }
    }
  }
  /**
   * Deletes a WebGLBuffer object and destroy resource
   */
  public delete() {
    this._gl.deleteBuffer(this._buffer);
    this._buffer = null;
    this._gl = null;
    Buffer.COUNT--;
  }

  public get count(): number {
    return this._count;
  }

  public get offset(): number {
    return this._offset;
  }

  public get buffer(): WebGLBuffer {
    return this._buffer;
  }
}
