import Buffer from './Buffer';

export default class IndexBuffer extends Buffer {
  elementType: number;
  elementSize: number;

  constructor(gl, options) {
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

    this.elementType = elementType;
    this.elementSize = elementSize;
    this.count = data.length;
  }
}

IndexBuffer.prototype.TYPE = WebGLRenderingContext.ELEMENT_ARRAY_BUFFER;
