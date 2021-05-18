import { GLUtil } from './gl';
import { Trigger } from './trigger';
import { defineProperties } from './util';
let dataId = 1;

type DrawArraysType = {
  enable: boolean;
  mode: string; // A GLenum specifying the type primitive to render. Possible values are: ['POINTS','LINE_STRIP','LINE_LOOP','LINES','TRIANGLE_STRIP','TRIANGLE_FAN','TRIANGLES']
  first: number; // A GLint specifying the starting index in the array of vector points.
  count: number; // A GLsizei specifying the number of indices to be rendered.
};

type DrawElementsType = {
  enable: boolean;
  mode: string;
  /* 'POINTS', // 绘制一系列点
          'LINE_STRIP', // 绘制一个线条。即，绘制一系列线段，上一点连接下一点。
          'LINE_LOOP', // 绘制一个线圈。即，绘制一系列线段，上一点连接下一点，并且最后一点与第一个点相连。
          'LINES', // 绘制一系列单独线段。每两个点作为端点，线段之间不连接。
          'TRIANGLE_STRIP', // 绘制一个三角带 
          'TRIANGLE_FAN', // 绘制一个三角扇
          'TRIANGLES', // 绘制一系列三角形。每三个点作为顶点  */
  count: number; // 整数型 指定要渲染的元素数量.
  /*  枚举类型 指定元素数组缓冲区中的值的类型。可能的值是:
          gl.UNSIGNED_BYTE
          gl.UNSIGNED_SHORT
          当使用 OES_element_index_uint 扩展时: gl.UNSIGNED_INT
       */
  // Note that valid types for indexType above in WebGL1 are only gl.UNSIGNED_BYTE where you can only have indices from 0 to 255, and, gl.UNSIGNED_SHORT where the maximum index is 65535. There is an extension, OES_element_index_uint you can check for and enable which allows gl.UNSIGNED_INT and indices up to 4294967296.
  // https://webglfundamentals.org/webgl/lessons/webgl-indexed-vertices.html
  type: string;
  offset: number; //  字节单位 指定元素数组缓冲区中的偏移量。必须是给定类型大小的有效倍数.
  // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects
  indexArrayType: string; // Uint8Array、Uint32Array、Float32Array
};

type DrawArraysInstancedType = {
  enable: boolean;
  mode: string; // A GLenum specifying the type primitive to render. Possible values are:
  first: number; // A GLint specifying the starting index in the array of vector points.
  count: number; // A GLsizei specifying the number of indices to be rendered.
  instanceCount: number; // A GLsizei specifying the number of instances of the range of elements to execute.
  divisor: number;
};
type DrawElementsInstancedType = {
  enable: boolean;
  mode: string; // A GLenum specifying the type primitive to render. Possible values are:
  first: number; // A GLint specifying the starting index in the array of vector points.
  count: number; // A GLsizei specifying the number of indices to be rendered.
  instanceCount: number; // A GLsizei specifying the number of instances of the range of elements to execute.
  divisor: number;
};
export default class Data extends Trigger {
  options: Object;
  id: number;
  children: Array<Data>;

  vertices: [] | Float32Array;
  colors: [] | Float32Array;
  uv: [] | Float32Array;
  indices: [] | Uint16Array;
  pointsize: number;
  instanced: [] | Float32Array;

  // 🔺 Resources buffer
  _vertexBuffer: WebGLBuffer;
  _colorBuffer: WebGLBuffer;
  _indexBuffer: WebGLBuffer;
  _instanceBuffer: WebGLBuffer;
  _bufferMap: {};
  _counts: number;
  drawArrays: DrawArraysType;
  drawElements: DrawElementsType;
  drawArraysInstanced: DrawArraysInstancedType;
  drawElementsInstanced: DrawElementsInstancedType;
  constructor(options?: any) {
    super();
    this.options = options;
    this.id = dataId++;

    // 📈 Position Vertex Buffer Data
    this.vertices = (options && options.vertices) || [
      0.5, -0.5, 0.0, -0.5, -0.5, 0.0, 0.0, 0.5, 0.0,
    ];

    // 🎨 Color Vertex Buffer Data
    this.colors = (options && options.colors) || [
      1.0,
      0.0,
      0.0, // 🔴
      0.0,
      1.0,
      0.0, // 🟢
      0.0,
      0.0,
      1.0, // 🔵
    ];

    this.uv = (options && options.uv) || [];

    // 🗄️ Index Buffer Data
    this.indices = (options && options.indices) || [];
    this.pointsize = (options && options.pointsize) || 100.0;
    this.instanced = (options && options.instanced) || [];

    this.drawArrays = {
      enable: true,
      mode: 'POINTS', // A GLenum specifying the type primitive to render. Possible values are: ['POINTS','LINE_STRIP','LINE_LOOP','LINES','TRIANGLE_STRIP','TRIANGLE_FAN','TRIANGLES']
      first: 0, // A GLint specifying the starting index in the array of vector points.
      count: 0, // A GLsizei specifying the number of indices to be rendered.
    };
    this.drawElements = {
      enable: true,
      mode: 'POINTS',
      /* 'POINTS', // 绘制一系列点
              'LINE_STRIP', // 绘制一个线条。即，绘制一系列线段，上一点连接下一点。
              'LINE_LOOP', // 绘制一个线圈。即，绘制一系列线段，上一点连接下一点，并且最后一点与第一个点相连。
              'LINES', // 绘制一系列单独线段。每两个点作为端点，线段之间不连接。
              'TRIANGLE_STRIP', // 绘制一个三角带 
              'TRIANGLE_FAN', // 绘制一个三角扇
              'TRIANGLES', // 绘制一系列三角形。每三个点作为顶点  */
      count: 0, // 整数型 指定要渲染的元素数量.
      /*  枚举类型 指定元素数组缓冲区中的值的类型。可能的值是:
              gl.UNSIGNED_BYTE
              gl.UNSIGNED_SHORT
              当使用 OES_element_index_uint 扩展时: gl.UNSIGNED_INT
           */
      // Note that valid types for indexType above in WebGL1 are only gl.UNSIGNED_BYTE where you can only have indices from 0 to 255, and, gl.UNSIGNED_SHORT where the maximum index is 65535. There is an extension, OES_element_index_uint you can check for and enable which allows gl.UNSIGNED_INT and indices up to 4294967296.
      // https://webglfundamentals.org/webgl/lessons/webgl-indexed-vertices.html
      type: 'UNSIGNED_SHORT',
      offset: 0, //  字节单位 指定元素数组缓冲区中的偏移量。必须是给定类型大小的有效倍数.
      // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects
      indexArrayType: 'Uint16Array', // Uint8Array、Uint32Array、Float32Array
    };
    this.drawArraysInstanced = {
      enable: false,
      mode: 'POINTS', // A GLenum specifying the type primitive to render. Possible values are:
      first: 0, // A GLint specifying the starting index in the array of vector points.
      count: 1, // A GLsizei specifying the number of indices to be rendered.
      instanceCount: 0, // A GLsizei specifying the number of instances of the range of elements to execute.
      divisor: 1,
    };
    this.drawElementsInstanced = {
      enable: false,
      mode: 'POINTS', // A GLenum specifying the type primitive to render. Possible values are:
      first: 0, // A GLint specifying the starting index in the array of vector points.
      count: 1, // A GLsizei specifying the number of indices to be rendered.
      instanceCount: 0, // A GLsizei specifying the number of instances of the range of elements to execute.
      divisor: 1,
    };
  }

  createBuffer(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    program: WebGLProgram
  ) {
    // vertex buffer
    if (this.vertices && this.vertices.length > 0) {
      this._vertexBuffer = GLUtil.vbo(
        gl,
        program,
        'a_vertex',
        new Float32Array(this.vertices)
      );
    }

    // color buffer
    if (this.colors && this.colors.length > 0) {
      this._colorBuffer = GLUtil.vbo(
        gl,
        program,
        'a_color',
        new Float32Array(this.colors)
      );
    }

    // index buffer
    if (this.indices && this.indices.length > 0) {
      if (this.drawElements.indexArrayType === 'Uint8Array') {
        this._indexBuffer = GLUtil.ibo(gl, new Uint8Array(this.indices));
      } else if (this.drawElements.indexArrayType === 'Uint16Array') {
        this._indexBuffer = GLUtil.ibo(gl, new Uint16Array(this.indices));
      }
    }

    if (this.pointsize) {
      const a_pointsize = gl.getAttribLocation(program, 'a_pointsize');
      gl.vertexAttrib1f(a_pointsize, this.pointsize || 10.0);
    }
  }

  draw(gl: WebGLRenderingContext | WebGL2RenderingContext) {
    if (this._instanceBuffer) {
      if (this._indexBuffer) {
        // gl.drawElementsInstanced();
      } else {
        // gl.drawArraysInstanced();
      }
    } else if (this._indexBuffer) {
      if (this.drawElements.enable) {
        if (this.drawElements.indexArrayType === 'Uint8Array') {
          gl.drawElements(
            gl[this.drawElements.mode],
            this.drawElements.count,
            gl[this.drawElements.type],
            this.drawElements.offset * Uint8Array.BYTES_PER_ELEMENT
          );
        } else if (this.drawElements.indexArrayType === 'Uint16Array') {
          gl.drawElements(
            gl[this.drawElements.mode],
            this.drawElements.count,
            gl[this.drawElements.type],
            this.drawElements.offset * Uint16Array.BYTES_PER_ELEMENT
          );
        }
      }
    } else {
      this.drawArrays.enable &&
        gl.drawArrays(
          gl[this.drawArrays.mode],
          this.drawArrays.first,
          this.drawArrays.count
        );
    }
  }
}

defineProperties(Data.prototype, [
  {
    name: 'pointSize',
    get() {
      return this.pointsize;
    },
    set(value) {
      let old = this.pointsize;
      this.pointsize = value;
      this.fire({
        type: 'change',
        oldValue: old,
        newValue: value,
      });
    },
  },
]);
