import Buffer, { BufferDescriptor } from './Buffer';
export interface IndexBufferDescriptor extends BufferDescriptor {
  data:
    | Int8Array
    | Uint8Array
    | Uint8ClampedArray
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array;
}
export default class IndexBuffer extends Buffer {
  private _elementType: number;
  private _elementSize: number;
  constructor(gl: WebGL2RenderingContext, options: IndexBufferDescriptor) {
    Buffer.TYPE = WebGLRenderingContext.ELEMENT_ARRAY_BUFFER;

    let { data } = options,
      elementSize = data.BYTES_PER_ELEMENT,
      elementType;

    if (elementSize) {
      if (elementSize === 1) {
        elementType = 5121;
      } else if (elementSize === 2) {
        elementType = 5123;
      } else {
        elementType = 5125;
      }
    } else {
      if (data.length <= 256) {
        elementType = 5121; // WebGLRenderingContext.UNSIGNED_BYTE
        elementSize = 1;
        data = new Uint8Array(data);
      } else if (data.length <= 65536) {
        elementType = 5123; // WebGLRenderingContext.UNSIGNED_SHORT
        elementSize = 2;
        data = new Uint16Array(data);
      } else {
        elementType = 5125; // WebGLRenderingContext.UNSIGNED_INT
        elementSize = 4;
        data = new Uint32Array(data);
      }
      options.data = data;
    }
    super(gl, options);
    this._elementType = elementType;
    this._elementSize = elementSize;
    this._count = data.length;
  }

  public get elementType(): number {
    return this._elementType;
  }
}
