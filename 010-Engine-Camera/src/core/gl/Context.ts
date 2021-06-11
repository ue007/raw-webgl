import { default as Program } from './Program';
import VertexArray from './VertexArray';

export interface GLContext extends WebGL2RenderingContext {
  _program: Program;
  _vao: VertexArray; // cache vao
}
