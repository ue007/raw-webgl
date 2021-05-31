import Buffer from './Buffer';
type DataBufferType = {
  name?: string;
  buffer?: WebGLBuffer;
  stride?: number;
  size?: number;
  usage?: number;
  offset?: number;
  type?: number;
  data?: Array<number>;
};
// vbo : position vbo 、color vbo
export default class DataBuffer extends Buffer {
  _offset: number;
  _type: number;
  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    options: DataBufferType
  ) {
    super(gl, options);
    this._offset = options.offset || 0;
    this._type = options.type || gl.FLOAT;

    if (this.name === 'position') {
      if (this._stride) {
        this.count = options.data.length / this._stride;
      } else {
        this.count = options.data.length / this.size;
      }
    }
    if (this.name === 'offset') {
      this.instanceCount = options.data.length / 16;
    }
  }

  bindAttrib(attribute) {
    let gl = this._gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
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
          // webgl 2.0
          // gl.vertexAttribDivisor(attribute.location + i, 1);
        }
      }
    } else {
      gl.enableVertexAttribArray(attribute.location);
      // index, size, type, normalized, stride, offset
      gl.vertexAttribPointer(
        attribute.location,
        this.size || attribute.size,
        this._type,
        false,
        this._stride,
        this._offset
      );
      if (attribute.name === 'offset') {
        // webgl 2.0
        // gl.vertexAttribDivisor(attribute.location, 1);
      }
    }
  }
}
