import { Trigger } from './trigger';
import { defineProperties } from './util';
let dataId = 1;
export default class Data extends Trigger {
  id: number;
  children: Array<Data>;
  vertices: Float32Array;
  colors: Float32Array;
  uv: Float32Array;
  indices: Uint16Array;
  pointsize: number;
  instanced: Float32Array;
  options: Object;

  constructor(options?: any) {
    super();
    this.options = options;
    this.id = dataId++;

    // 📈 Position Vertex Buffer Data
    this.vertices =
      (options && options.vertices) ||
      new Float32Array([0.5, -0.5, 0.0, -0.5, -0.5, 0.0, 0.0, 0.5, 0.0]);

    // 🎨 Color Vertex Buffer Data
    this.colors =
      (options && options.colors) ||
      new Float32Array([
        1.0,
        0.0,
        0.0, // 🔴
        0.0,
        1.0,
        0.0, // 🟢
        0.0,
        0.0,
        1.0, // 🔵
      ]);

    this.uv = (options && options.uv) || [];

    // 🗄️ Index Buffer Data
    this.indices = new Uint16Array([0, 1, 2]);
    this.pointsize = (options && options.pointsize) || 100.0;
    this.instanced = (options && options.instanced) || [];
  }
}
