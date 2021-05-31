import { glMatrix, vec3 } from 'gl-matrix';
import BoundingBox from '../math/BoundingBox';
import IndexBuffer from './IndexBuffer';
import DataBuffer from './DataBuffer';
import { Program } from './Program';

let nextVertexArrayId = 0,
  vert0 = vec3.create(),
  vert1 = vec3.create(),
  vert2 = vec3.create(),
  edge1 = vec3.create(),
  edge2 = vec3.create(),
  tvec = vec3.create(),
  pvec = vec3.create(),
  qvec = vec3.create(),
  { EPSILON } = glMatrix;

/**
 * VertexArray, it is mapping to WebGLVertexArrayObject
 * @param {Object} options - used to init VertexArray
 * @param {Object} options.buffers - buffer datas
 * @param {Array} options.buffers.position - vertex datas, [] or { data: [], type: 0, stride: 0, offset: 0 }
 * @param {Array} options.buffers.normal - normal datas
 * @param {Array} options.buffers.uv - uv datas
 * @param {Array} options.buffers.tangent - tangent datas
 * @param {Array} options.buffers.color - color datas
 * @param {Array} options.buffers.index - index datas
 * @param {String} [options.mode='TRIANGLES'] - draw mode
 * @example
 * const vao = new VertexArray({
 *   buffers: {
 *     position: [],
 *     normal: [],
 *     uv: [],
 *     tangent: [],
 *     color: [],
 *     index: [],
 *   },
 *   mode: 'TRIANGLES',
 * });
 */
export default class VertexArray {
  private COUNT = 0;
  id: number;
  _gl: WebGL2RenderingContext;
  _vao: any;
  _indexBuffer: IndexBuffer;
  _vertexBuffer: DataBuffer;
  _colorBuffer: DataBuffer;
  _instanceBuffer: DataBuffer;
  _bufferMap: Object;
  _program: Program;
  _mode: string;
  _counts: Array<any>;
  _buffers: Array<any>;
  _color: any;
  boundingBox: BoundingBox;

  constructor(options) {
    this.id = ++nextVertexArrayId;
    this._vao = null;
    this._indexBuffer = null;
    this._vertexBuffer = null;
    this._instanceBuffer = null;
    this._bufferMap = {};
    this._program = null;
    this._mode = options.mode || 'TRIANGLES';
    this._counts = options.counts;
    this._buffers = options.buffers;
    this._color = !!options.buffers.color;

    let bufferData = options.buffers.position;
    if (bufferData.min) {
      this.boundingBox = new BoundingBox(bufferData.min, bufferData.max);
    } else {
      this.boundingBox = BoundingBox.fromPoints(bufferData.data || bufferData);
    }
  }

  /**
   * Init VertexArray, create WebGL related objects
   * @private
   */
  _init() {
    this.COUNT++;
    let gl = this._gl,
      buffers = this._buffers,
      dataBufferMap = new Map();
    this._mode = gl[this._mode];

    this._vao = gl.createVertexArray();
    gl.bindVertexArray(this._vao);

    Object.keys(buffers).forEach((attrName) => {
      let bufferData = buffers[attrName];

      if (attrName === 'index') {
        this._indexBuffer = new IndexBuffer(gl, {
          data: bufferData,
        });
      } else {
        let data = bufferData.data || bufferData;
        let dataBuffer = dataBufferMap[data];
        let buffer = (this._bufferMap[attrName] = new DataBuffer(gl, {
          name: attrName,
          buffer: dataBuffer && dataBuffer.buffer,
          data,
          stride: bufferData.stride,
          offset: bufferData.offset,
          type: bufferData.type,
          size: bufferData.size,
          usage: bufferData.usage,
        }));
        if (!dataBuffer) {
          dataBufferMap[data] = buffer;
        }
        if (attrName === 'position') {
          this._vertexBuffer = buffer;
        }
        if (attrName === 'offset') {
          this._instanceBuffer = buffer;
        }
      }
    });
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }

  /**
   * Set vertex datas
   * @param {Array} data - vertex datas
   */
  setPosition(data) {
    this.setBufferDatas('position', data);
  }

  /**
   * Set buffer datas
   * @param {String} name - buffer name
   * @param {Array} data - buffer datas
   */
  setBufferDatas(name, data) {
    let gl = this._gl;
    if (gl) {
      let buffer = this._bufferMap[name];
      gl.bindVertexArray(this._vao);
      if (buffer) {
        buffer.bindData(data);
        if (name === 'position') {
          BoundingBox.fromPoints(data, this.boundingBox);
        }
      } else {
        this._bufferMap[name] = buffer = new DataBuffer(gl, {
          name,
          data,
        });
        if (name === 'position') {
          this._vertexBuffer = buffer;
          BoundingBox.fromPoints(data, this.boundingBox);
        }
        if (name === 'offset') {
          this._instanceBuffer = buffer;
        }
      }
    } else {
      this._buffers[name] = data;
    }
  }

  /**
   * Bind VertexArray for drawing
   * @param  {WebGL2RenderingContext} gl - WebGL context
   */
  bind(gl) {
    if (!this._gl) {
      this._gl = gl;
      this._init();
    }
    let bufferMap = this._bufferMap,
      program = gl._program;
    if (!gl._program || !gl._program._program) {
      return;
    }
    if (gl._vao !== this) {
      gl.bindVertexArray(this._vao);
      gl._vao = this;
    }
    if (this._program !== program) {
      this._program = program;
      Object.keys(bufferMap).forEach((key) => {
        let attribute = program._attributes[key];
        if (attribute) {
          bufferMap[key].bindAttrib(attribute);
        }
      });
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
  }

  /**
   * Draw VetexArray, it is mapping to gl.drawElements
   * @param  {WebGL2RenderingContext} gl - WebGL context
   * @param  {Number} offset - the offset in array buffer
   * @param  {Number} count  - the number of elements to be drew
   */
  draw(gl, offset, count) {
    this.bind(gl);
    if (this._instanceBuffer) {
      if (this._indexBuffer) {
        let { elementType } = this._indexBuffer;
        // mode, count, type, offset, instanceCount
        gl.drawElementsInstanced(
          this._mode,
          this._indexBuffer.count,
          elementType,
          offset || 0,
          this._instanceBuffer.instanceCount
        );
      } else {
        // mode, first, count, instanceCount
        gl.drawArraysInstanced(
          this._mode,
          offset || 0,
          this._vertexBuffer.count,
          this._instanceBuffer.instanceCount
        );
      }
    } else if (this._indexBuffer) {
      if (this._counts) {
        this._counts.forEach((countItem) => {
          let { elementType, elementSize } = this._indexBuffer;
          // mode, count, type, offset
          gl.drawElements(
            this._mode,
            countItem.count,
            elementType,
            countItem.offset * elementSize
          );
        });
      } else {
        let { elementType } = this._indexBuffer;
        // mode, count, type, offset
        gl.drawElements(
          this._mode,
          this._indexBuffer.count,
          elementType,
          offset || 0
        );
      }
    } else if (this._counts) {
      this._counts.forEach((countItem) => {
        gl.drawArrays(this._mode, countItem.offset, countItem.count);
      });
    } else {
      gl.drawArrays(this._mode, offset || 0, count || this._vertexBuffer.count);
    }
  }

  /**
   * Bind VetexArray for feedback
   * @param  {WebGL2RenderingContext} gl - WebGL context
   */
  bindFeedback(gl) {
    if (!this._gl) {
      this._gl = gl;
      this._init();
    }
    gl.bindBufferBase(
      gl.TRANSFORM_FEEDBACK_BUFFER,
      0,
      this._vertexBuffer.buffer
    );
  }

  /**
   * Draw VetexArray for feedback
   * @param  {WebGL2RenderingContext} gl - WebGL context
   * @param  {Number} offset - the offset in array buffer
   * @param  {Number} count  - the number of elements to be drew
   */
  drawFeedback(gl, offset, count) {
    if (!this._gl) {
      this._gl = gl;
      this._init();
    }
    gl.enable(gl.RASTERIZER_DISCARD);
    gl.beginTransformFeedback(this._mode);
    this.draw(gl, offset, count);
    gl.endTransformFeedback();
    gl.disable(gl.RASTERIZER_DISCARD);
  }

  /**
   * Dispose VertexArray, release related resource
   */
  dispose() {
    let gl = this._gl,
      bufferMap = this._bufferMap;
    if (gl) {
      Object.keys(bufferMap).forEach((key) => {
        bufferMap[key].dispose();
      });
      // gl.deleteVertexArray(this._vao);
      this._vao = null;
      this._gl = null;
      this._bufferMap = {};
      this._program = null;
    }
    this.COUNT--;
  }

  // https://github.com/erich666/jgt-code/blob/master/Volume_02/Number_1/Moller1997a/raytri.c
  // https://en.wikipedia.org/wiki/M%C3%B6ller%E2%80%93Trumbore_intersection_algorithm
  // https://www.scratchapixel.com/code.php?id=11&origin=/lessons/3d-basic-rendering/ray-tracing-polygon-mesh&src=0
  // https://github.com/substack/ray-triangle-intersection/blob/master/index.js
  /**
   * @typedef {Objecct} VertexArray~Intersection
   * @property {vec3} position - intersected position
   * @property {Number} t - distance from org to intersection point
   */
  /**
   * Get intersection of a ray and VertexArray
   * @param  {vec3} org - origin of ray
   * @param  {vec3} dir - direction of ray
   * @return {VertexArray~Intersection}     return intersection info
   */
  intersect(org, dir) {
    if (!this._vertexBuffer) {
      return null;
    }
    let indices = this._indexBuffer && this._indexBuffer.data,
      vertices = this._vertexBuffer.data,
      { size } = this._vertexBuffer,
      count = (indices && indices.length) || this._vertexBuffer.count,
      minT = Number.MAX_VALUE,
      intersected = false,
      u,
      v,
      t,
      det,
      invDet,
      i,
      index,
      intersectedPosition;

    function intersectTriangle() {
      /* find vectors for two edges sharing vert0 */
      vec3.sub(edge1, vert1, vert0);
      vec3.sub(edge2, vert2, vert0);

      /* begin calculating determinant - also used to calculate U parameter */
      vec3.cross(pvec, dir, edge2);

      /* if determinant is near zero, ray lies in plane of triangle */
      det = vec3.dot(edge1, pvec);

      if (det > -EPSILON && det < EPSILON) {
        return false;
      }
      invDet = 1.0 / det;

      /* calculate distance from vert0 to ray origin */
      vec3.sub(tvec, org, vert0);

      /* calculate U parameter and test bounds */
      u = vec3.dot(tvec, pvec) * invDet;
      if (u < 0.0 || u > 1.0) {
        return false;
      }

      /* prepare to test V parameter */
      vec3.cross(qvec, tvec, edge1);

      /* calculate V parameter and test bounds */
      v = vec3.dot(dir, qvec) * invDet;
      if (v < 0.0 || u + v > 1.0) {
        return false;
      }

      /* calculate t, ray intersects triangle */
      t = vec3.dot(edge2, qvec) * invDet;

      return true;
    }

    if (indices) {
      for (i = 0; i < count; i += 3) {
        index = indices[i] * 3;
        vec3.set(
          vert0,
          vertices[index],
          vertices[index + 1],
          vertices[index + 2]
        );
        index = indices[i + 1] * 3;
        vec3.set(
          vert1,
          vertices[index],
          vertices[index + 1],
          vertices[index + 2]
        );
        index = indices[i + 2] * 3;
        vec3.set(
          vert2,
          vertices[index],
          vertices[index + 1],
          vertices[index + 2]
        );
        if (intersectTriangle() && t < minT) {
          minT = t;
          if (!intersected) {
            intersected = true;
          }
        }
      }
    } else {
      index = 0;
      for (i = 0; i < count; i += size) {
        vec3.set(
          vert0,
          vertices[index++],
          vertices[index++],
          vertices[index++]
        );
        vec3.set(
          vert1,
          vertices[index++],
          vertices[index++],
          vertices[index++]
        );
        vec3.set(
          vert2,
          vertices[index++],
          vertices[index++],
          vertices[index++]
        );
        if (intersectTriangle() && t < minT) {
          minT = t;
          if (!intersected) {
            intersected = true;
          }
        }
      }
    }
    if (intersected) {
      intersectedPosition = vec3.create();
      vec3.scaleAndAdd(intersectedPosition, org, dir, minT);
      return {
        position: intersectedPosition,
        t: minT,
      };
    }
    return null;
  }
}
