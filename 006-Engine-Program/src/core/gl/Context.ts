import { default as Program } from './Program';

export interface GLContext extends WebGL2RenderingContext {
  _program: Program;
}
