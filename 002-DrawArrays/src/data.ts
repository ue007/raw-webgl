export default class Data {
  vertices: Float32Array;
  colors: Float32Array;
  indices: Uint16Array;

  constructor() {
    // 📈 Position Vertex Buffer Data
    this.vertices = new Float32Array([
      1.0, -1.0, 0.0, -1.0, -1.0, 0.0, 0.0, 1.0, 0.0,
    ]);

    // 🎨 Color Vertex Buffer Data
    this.colors = new Float32Array([
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

    // 🗄️ Index Buffer Data
    this.indices = new Uint16Array([0, 1, 2]);
  }
}
