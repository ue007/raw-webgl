export const GLUtil = {
  getCanvas: function (canvasOrid) {
    let canvas;
    if (typeof canvasOrid === 'string') {
      // id
      canvas = document.getElementById(canvasOrid);
    } else {
      canvas = canvasOrid;
    }
    return canvas;
  },

  // get webgl or webgl context
  getWebGLContext: function (canvas, webgl2) {
    if (!canvas) {
      return;
    }
    if (webgl2) {
      return canvas.getContext('webgl2');
    }
    return (
      canvas.getContext('experimental-webgls') || canvas.getContext('webgl')
    );
  },
  /**
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLProgram
   **/
  program: function (gl, vs, fs, feedback) {
    vs = this.shader(gl, gl.VERTEX_SHADER, vs);
    fs = this.shader(gl, gl.FRAGMENT_SHADER, fs);
    var program = gl.createProgram();
    gl.program = program;

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    if (feedback) {
      gl.transformFeedbackVaryings(
        program,
        feedback.varyings || ['gl_Position'],
        feedback.bufferMode || gl.SEPARATE_ATTRIBS
      );
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      var info = gl.getProgramInfoLog(program);
      throw 'Could not compile WebGL program. \n\n' + info;
    }
    gl.useProgram(program);
    // https://stackoverflow.com/questions/9113154/proper-way-to-delete-glsl-shader
    // Yes-- in fact it is highly desireable to detach and delete your shader objects as soon as possible.That way the driver can free up all the memory it is using to hold a copy of the shader source and unlinked object code, which can be quite substantial.Measurements I have done indicate that NOT deleting the shader objects increases the incremental memory use per shader by 5 - 10x
    // gl.deleteProgram(program);
    return program;
  },
  /**
   * @param [int] type 参数为gl.VERTEX_SHADER 或 gl.FRAGMENT_SHADER两者中的一个
   **/
  shader: function (gl, type, source) {
    var shader = gl.createShader(type); // https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/createShader
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('ERROR compiling shader!', gl.getShaderInfoLog(shader));
      return;
    }
    return shader;
  },
  buffer: function (
    gl,
    vertices,
    index,
    size,
    type,
    normalized,
    stride,
    offset
  ) {
    index = gl.getAttribLocation(gl.program, index);
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(index, size, type, normalized, stride, offset); // https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
    gl.enableVertexAttribArray(index);
    return buffer;
  },
  attribute: function (
    gl,
    vertices,
    index,
    size,
    type,
    normalized,
    stride,
    offset
  ) {
    index = gl.getAttribLocation(gl.program, index);
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(index, size, type, normalized, stride, offset); // https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
    gl.enableVertexAttribArray(index);
    return buffer;
  },
  ibo: function (gl, indices) {
    // 创建IBO  @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLBuffer
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    // 指定绘制时使用的索引数组
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  },
  // vao 改进
  vao2: function (gl, buffers, indices) {
    var vao;
    if (gl instanceof WebGL2RenderingContext) {
      vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
    } else if (gl.ext) {
      vao = gl.ext.createVertexArrayOES();
      gl.ext.bindVertexArrayOES(vao);
    } else {
      console.warn('not support vao');
      return;
    }

    Object.keys(buffers).forEach((attrName) => {
      let bufferData = buffers[attrName];

      var index = gl.getAttribLocation(gl.program, bufferData.index);
      var buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, bufferData.data, gl.STATIC_DRAW);
      gl.vertexAttribPointer(
        index,
        bufferData.size,
        bufferData.type,
        bufferData.normalized,
        bufferData.stride,
        bufferData.offset
      ); // https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
      gl.enableVertexAttribArray(index);
      if (attrName === 'color' || attrName === 'instanced') {
        gl.vertexAttribDivisor(index, bufferData.divisor); // attribute used once per instance
      }
    });

    // index
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    if (gl instanceof WebGL2RenderingContext) {
      gl.bindVertexArray(null);
    } else if (gl.ext) {
      gl.ext.bindVertexArrayOES(null);
    }
    return vao;
  },
  vao: function (gl, vertex, indices) {
    // vao
    var vao = gl.ext.createVertexArrayOES();
    gl.ext.bindVertexArrayOES(vao);

    // vertex
    var position = vertex.position;
    var index = gl.getAttribLocation(gl.program, position.index);
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, position.vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(
      index,
      position.size,
      position.type,
      position.normalized,
      position.stride,
      position.offset
    ); // https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
    gl.enableVertexAttribArray(index);

    // uv
    var position = uv.position;
    var index = gl.getAttribLocation(gl.program, position.index);
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, position.vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(
      index,
      position.size,
      position.type,
      position.normalized,
      position.stride,
      position.offset
    ); // https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
    gl.enableVertexAttribArray(index);

    // color
    var color = vertex.color;
    var index = gl.getAttribLocation(gl.program, color.index);
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, color.vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(
      index,
      color.size,
      color.type,
      color.normalized,
      color.stride,
      color.offset
    ); // https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
    gl.enableVertexAttribArray(index);

    // index
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.ext.bindVertexArrayOES(null);
    return vao;
  },
  texture: function (image) {},
};
