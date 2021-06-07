import { mat4 } from 'gl-matrix';
import { GLContext } from './Context';
import { SHADER_PREFIX } from './Shader';

let DEBUG = true;

let attributeSizeMap = {
  5126: 1, // WebGLRenderingContext.FLOAT
  35664: 2, // WebGLRenderingContext.FLOAT_VEC2
  35665: 3, // WebGLRenderingContext.FLOAT_VEC3
  35666: 4, // WebGLRenderingContext.FLOAT_VEC4
  35676: 16, // WebGLRenderingContext.FLOAT_MAT4
};

let nextProgramId = 0;

export interface ProgramDescriptor {
  vertex: string;
  fragment: string;
  transformFeedback?: WebGLTransformFeedback;
}

/* {
  u_projectionViewMatrix: projectionViewMatrix,
  u_modelMatrix: modelMatrix,
} */
export type UniformType = {
  location: number;
  type: number;
  array: Array<number>;
  u_projectionViewMatrix: mat4;
  u_modelMatrix: mat4;
};

export function getUniform(uniform: UniformType, arg: string) {
  interface UniformType {
    [key: string]: any;
  }
  return (<UniformType>uniform)[arg];
}

/**
 * Program, mapping to WebGLProgram
 * @param {Object} options - program options
 * @param {String} options.vertex - GLSL source code for vertex shader
 * @param {String} options.fragment - GLSL source code for fragment shader
 * @param {Object} [options.transformFeedback] - specifies values to record in WebGLTransformFeedback buffers
 * @param {String[]} options.transformFeedback.varyings - the the names of the varying variables to use
 * @param {Object} options.transformFeedback.bufferMode='INTERLEAVED_ATTRIBS' - the mode to use when capturing the varying variables
 * @example
 * const program = new Program({
 *   vertex: `#version 300 es
 *     precision highp float;
 *     layout(std140, column_major) uniform;
 *
 *     uniform mat4 u_projectionViewMatrix;
 *     uniform mat4 u_modelMatrix;
 *     in vec3 a_position;
 *
 *     void main () {
 *       gl_Position = u_projectionViewMatrix * u_modelMatrix * vec4(a_position, 1.0);
 *     }
 *   `,
 *   fragment: `#version 300 es
 *     precision highp float;
 *     layout(std140, column_major) uniform;
 *
 *     out vec4 fragColor;
 *
 *     void main () {
 *       fragColor = vec4(1.0);
 *     }
 *   `,
 * });
 */
export default class Program {
  private static COUNT: number = 0;
  private _id: number;
  private _attributes: object = new Map();
  private _uniforms: Map<string, UniformType>;
  private _program: any;
  private _vertexSource: any;
  private _fragmentSource: any;
  private _transformFeedback: any;
  private _error: any;
  private _gl: GLContext;

  constructor(options: ProgramDescriptor) {
    Program.COUNT++;
    this._id = ++nextProgramId;

    this._attributes = null;
    this._uniforms = null;
    this._program = null;
    this._vertexSource = options.vertex;
    this._fragmentSource = options.fragment;
    this._transformFeedback = options.transformFeedback;
    this._error = null;
  }

  /**
   * Set GLSL source code for shader
   * @param {String} vertexSource - GLSL source code for vertex shader
   * @param {String} fragmentSource - GLSL source code for fragment shader
   */
  setSource(vertexSource: string, fragmentSource: string) {
    let self = this;
    let gl = this._gl,
      vertexShader,
      fragmentShader,
      program,
      attribCount,
      uniformCount,
      i,
      attrib,
      uniform,
      attribName;

    function loadShader(type: number, source: string) {
      let shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      // https://www.khronos.org/webgl/wiki/HandlingContextLost#Handling_Shaders_and_Programs
      if (
        !gl.getShaderParameter(shader, gl.COMPILE_STATUS) &&
        !gl.isContextLost()
      ) {
        let errorType = type === gl.VERTEX_SHADER ? 'vertex' : 'fragment';
        self._error = `Create ${errorType} shader ${gl.getShaderInfoLog(
          shader
        )}\n${source}`;
        console.log(self._error);
        gl.deleteShader(shader);
        return null;
      }

      return shader;
    }

    vertexShader = loadShader(gl.VERTEX_SHADER, vertexSource);
    if (!vertexShader) {
      return false;
    }

    fragmentShader = loadShader(gl.FRAGMENT_SHADER, fragmentSource);
    if (!fragmentShader) {
      return false;
    }

    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    if (this._transformFeedback) {
      gl.transformFeedbackVaryings(
        program,
        this._transformFeedback.varyings,
        gl['INTERLEAVED_ATTRIBS']
      );
    }

    gl.linkProgram(program);

    // https://www.khronos.org/webgl/wiki/HandlingContextLost#Handling_Shaders_and_Programs
    if (
      !gl.getProgramParameter(program, gl.LINK_STATUS) &&
      !gl.isContextLost()
    ) {
      this._error = `Link program error: ${gl.getProgramInfoLog(program)}`;
      console.error(this._error);
      gl.deleteProgram(program);
      return false;
    }
    if (!DEBUG) {
      gl.detachShader(program, vertexShader);
      gl.detachShader(program, fragmentShader);
    }
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    if (this._program) {
      this._gl.deleteProgram(this._program);
    }
    this._error = null;
    this._program = program;
    this._vertexSource = vertexSource;
    this._fragmentSource = fragmentSource;

    let attributes = (this._attributes = new Map());
    let uniforms = (this._uniforms = new Map());
    attribCount = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (i = 0; i < attribCount; i++) {
      attrib = gl.getActiveAttrib(program, i);
      if (attrib) {
        attribName = attrib.name.substr(2);
        let size: number;
        size = attributeSizeMap[5126]; // WebGLRenderingContext.FLOAT
        if (attrib.type === 35664) {
          // WebGLRenderingContext.FLOAT_VEC2
          size = attributeSizeMap[35664];
        } else if (attrib.type === 35665) {
          // WebGLRenderingContext.FLOAT_VEC3
          size = attributeSizeMap[35665];
        } else if (attrib.type === 35666) {
          // WebGLRenderingContext.FLOAT_VEC4
          size = attributeSizeMap[35666];
        } else if (attrib.type === 35676) {
          // WebGLRenderingContext.FLOAT_MAT4
          size = attributeSizeMap[35676];
        }
        attributes.set(attribName, {
          name: attribName,
          location: gl.getAttribLocation(program, attrib.name),
          type: attrib.type,
          size,
        });
      }
    }

    uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (i = 0; i < uniformCount; i++) {
      uniform = gl.getActiveUniform(program, i);
      if (uniform) {
        uniforms.set(uniform.name, {
          location: gl.getUniformLocation(program, uniform.name),
          type: uniform.type,
        });
        let indexOfArray = uniform.name.indexOf('['),
          indexOfdot = uniform.name.indexOf('.'),
          uniformName = uniform.name.substr(0, indexOfArray);
        if (indexOfArray > 0 && indexOfdot < 0) {
          let location = gl.getUniformLocation(program, uniformName);
          uniforms.set(uniformName, {
            location,
            type: uniform.type,
            array: true,
          });
        }
      }
    }
    return true;
  }

  /**
   * Use program
   * @param  {WebGL2RenderingContext} gl - WebGL context
   */
  use(gl: GLContext) {
    if (!this._gl) {
      this._gl = gl;
      this.setSource(this._vertexSource, this._fragmentSource);
    }
    if (gl._program !== this) {
      gl.useProgram(this._program);
      gl._program = this;
      return true;
    }
    return false;
  }

  /**
   * Set values for uniforms
   * @param  {Object} values - values for uniforms
   * @example
   * program.use(gl);
   * program.bindUniforms({
   *   u_projectionViewMatrix: projectionViewMatrix,
   *   u_modelMatrix: modelMatrix,
   * });
   */
  bindUniforms(values: UniformType) {
    if (!this._program) {
      return;
    }
    Object.keys(values).forEach((name) => {
      let value = getUniform(values, name);
      this.bindUniform(name, value);
    });
  }

  /**
   * Set value for uniform
   * @param  {String} name - uniform variable name
   * @param  {Object} value - new value
   * @example
   * program.use(gl);
   * program.bindUniform('u_projectionViewMatrix', projectionViewMatrix);
   */
  bindUniform(name: string, value: any) {
    if (value == null || !this._program) {
      return;
    }

    let gl = this._gl,
      uniform = this._uniforms.get(name);

    if (!uniform) {
      return;
    }

    let { type, location } = uniform;
    let isArray = uniform.array;

    switch (type) {
      case gl.INT:
      case gl.BOOL:
      case gl.SAMPLER_2D:
      case gl.SAMPLER_CUBE:
        gl.uniform1i(location, value);
        break;
      case gl.INT_VEC2:
      case gl.BOOL_VEC2:
        gl.uniform2iv(location, value);
        break;
      case gl.INT_VEC3:
      case gl.BOOL_VEC3:
        gl.uniform3iv(location, value);
        break;
      case gl.INT_VEC4:
      case gl.BOOL_VEC4:
        gl.uniform4iv(location, value);
        break;
      case gl.FLOAT:
        if (isArray) {
          gl.uniform1fv(location, value);
        } else {
          gl.uniform1f(location, value);
        }
        break;
      case gl.FLOAT_VEC2:
        gl.uniform2fv(location, value);
        break;
      case gl.FLOAT_VEC3:
        gl.uniform3fv(location, value);
        break;
      case gl.FLOAT_VEC4:
        gl.uniform4fv(location, value);
        break;
      case gl.FLOAT_MAT2:
        gl.uniformMatrix2fv(location, false, value);
        break;
      case gl.FLOAT_MAT3:
        gl.uniformMatrix3fv(location, false, value);
        break;
      case gl.FLOAT_MAT4:
        gl.uniformMatrix4fv(location, false, value);
        break;
      default:
        break;
    }
  }

  /**
   * Dispose Program, release related resource
   */
  dispose() {
    this._gl.deleteProgram(this._program);
    this._program = null;
    this._gl = null;
    Program.COUNT--;
  }

  public get program(): WebGLProgram {
    return this._program;
  }
}

export function createProgram(
  vertex: string,
  fragment: string,
  transformFeedback: WebGLTransformFeedback
) {
  return new Program({
    vertex: SHADER_PREFIX + vertex,
    fragment: SHADER_PREFIX + fragment,
    transformFeedback,
  });
}
