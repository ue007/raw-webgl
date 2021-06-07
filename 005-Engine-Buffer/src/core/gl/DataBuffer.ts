import Buffer, { BufferDescriptor } from './Buffer';
export interface DataBufferDescriptor extends BufferDescriptor {}

export class DataBuffer extends Buffer {
  private readonly TYPE: number = WebGLRenderingContext.ARRAY_BUFFER;
  constructor(gl: WebGL2RenderingContext, options: DataBufferDescriptor) {
    super(gl, options);
    console.log(this.TYPE);
  }

  /**
   * bind attribute
   * @param attribute
   */
  bindAttrib(attribute: string) {}
}
