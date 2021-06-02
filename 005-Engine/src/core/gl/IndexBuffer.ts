import Buffer, { BufferDescriptor } from './Buffer';
export interface IndexBufferDescriptor extends BufferDescriptor {}
export class IndexBuffer extends Buffer {
  private readonly TYPE: number = WebGLRenderingContext.ELEMENT_ARRAY_BUFFER;
  constructor(gl: WebGL2RenderingContext, options: IndexBufferDescriptor) {
    super(gl, options);
    console.log(this.TYPE);
  }
}
