export const GLUtil = {
  getCanvas(canvasOrid) {
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
  getContext(canvas, webgl2, options?) {
    if (!canvas) {
      return;
    }
    if (webgl2) {
      return canvas.getContext('webgl2', options);
    }
    return (
      canvas.getContext('experimental-webgls') || canvas.getContext('webgl')
    );
  },

  // 👋 Helper function for creating WebGLBuffer(s) out of Typed Arrays
  createBuffer(gl: WebGLRenderingContext | WebGL2RenderingContext, arr) {
    // ⚪ Create Buffer
    let buf = gl.createBuffer();
    let bufType =
      arr instanceof Uint16Array || arr instanceof Uint32Array
        ? gl.ELEMENT_ARRAY_BUFFER
        : gl.ARRAY_BUFFER;
    // 🩹 Bind Buffer to WebGLState
    gl.bindBuffer(bufType, buf);
    // 💾 Push data to VBO
    gl.bufferData(bufType, arr, gl.STATIC_DRAW);
    return buf;
  },

  // 👋 Helper function for creating WebGLShader(s) out of strings
  createShader(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    source: string,
    stage
  ) {
    // ⚪ Create Shader
    let s = gl.createShader(stage);
    // 📰 Pass Vertex Shader String
    gl.shaderSource(s, source);
    // 🔨 Compile Vertex Shader (and check for errors)
    gl.compileShader(s);
    // ❔ Check if shader compiled correctly
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(
        'An error occurred compiling the shader: ' + gl.getShaderInfoLog(s)
      );
    }
    return s;
  },

  // 👋 Helper function for creating WebGLProgram(s) out of WebGLShader(s)
  createProgram(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    stages: WebGLShader[]
  ) {
    let p = gl.createProgram();
    for (let stage of stages) {
      gl.attachShader(p, stage);
    }
    gl.linkProgram(p);
    return p;
  },
  // vertex Buffer Object
  vbo(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    program: WebGLProgram,
    name: string,
    data: Uint16Array | Uint32Array | Float32Array
  ) {
    // ⚪ Create Buffer
    let buf = gl.createBuffer();
    let bufType =
      data instanceof Uint16Array || data instanceof Uint32Array
        ? gl.ELEMENT_ARRAY_BUFFER
        : gl.ARRAY_BUFFER;

    // 🩹 Bind Buffer to WebGLState
    gl.bindBuffer(bufType, buf);

    // 💾 Push data to VBO
    gl.bufferData(bufType, data, gl.STATIC_DRAW);

    let location = gl.getAttribLocation(program, name);
    gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 4 * 3, 0);
    gl.enableVertexAttribArray(location);
    return buf;
  },
  attribute: function (
    gl,
    program,
    buffer,
    vertices,
    name,
    size,
    type,
    normalized,
    stride,
    offset
  ) {
    let location = gl.getAttribLocation(program, name);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(location, size, type, normalized, stride, offset); // https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
    gl.enableVertexAttribArray(location);
    return buffer;
  },
  ibo: function (gl, indices) {
    // 创建IBO  @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLBuffer
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    // 指定绘制时使用的索引数组
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    return buffer;
  },

  // /**
  //  *
  //  * @see https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLProgram
  //  **/
  // program: function (gl, vs, fs, feedback) {
  //   vs = this.shader(gl, gl.VERTEX_SHADER, vs);
  //   fs = this.shader(gl, gl.FRAGMENT_SHADER, fs);
  //   var program = gl.createProgram();
  //   gl.program = program;

  //   gl.attachShader(program, vs);
  //   gl.attachShader(program, fs);
  //   if (feedback) {
  //     gl.transformFeedbackVaryings(
  //       program,
  //       feedback.varyings || ['gl_Position'],
  //       feedback.bufferMode || gl.SEPARATE_ATTRIBS
  //     );
  //   }
  //   gl.linkProgram(program);
  //   if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  //     var info = gl.getProgramInfoLog(program);
  //     throw 'Could not compile WebGL program. \n\n' + info;
  //   }
  //   gl.useProgram(program);
  //   // https://stackoverflow.com/questions/9113154/proper-way-to-delete-glsl-shader
  //   // Yes-- in fact it is highly desireable to detach and delete your shader objects as soon as possible.That way the driver can free up all the memory it is using to hold a copy of the shader source and unlinked object code, which can be quite substantial.Measurements I have done indicate that NOT deleting the shader objects increases the incremental memory use per shader by 5 - 10x
  //   // gl.deleteProgram(program);
  //   return program;
  // },
  // /**
  //  * @param [int] type 参数为gl.VERTEX_SHADER 或 gl.FRAGMENT_SHADER两者中的一个
  //  **/
  // shader: function (gl, type, source) {
  //   var shader = gl.createShader(type); // https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/createShader
  //   gl.shaderSource(shader, source);
  //   gl.compileShader(shader);
  //   if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
  //     console.error('ERROR compiling shader!', gl.getShaderInfoLog(shader));
  //     return;
  //   }
  //   return shader;
  // },
  // buffer: function (
  //   gl,
  //   vertices,
  //   index,
  //   size,
  //   type,
  //   normalized,
  //   stride,
  //   offset
  // ) {
  //   index = gl.getAttribLocation(gl.program, index);
  //   var buffer = gl.createBuffer();
  //   gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  //   gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  //   gl.vertexAttribPointer(index, size, type, normalized, stride, offset); // https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
  //   gl.enableVertexAttribArray(index);
  //   return buffer;
  // },
  // attribute: function (
  //   gl,
  //   vertices,
  //   index,
  //   size,
  //   type,
  //   normalized,
  //   stride,
  //   offset
  // ) {
  //   index = gl.getAttribLocation(gl.program, index);
  //   var buffer = gl.createBuffer();
  //   gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  //   gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  //   gl.vertexAttribPointer(index, size, type, normalized, stride, offset); // https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
  //   gl.enableVertexAttribArray(index);
  //   return buffer;
  // },
  // ibo: function (gl, indices) {
  //   // 创建IBO  @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLBuffer
  //   var buffer = gl.createBuffer();
  //   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  //   gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  //   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  //   // 指定绘制时使用的索引数组
  //   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  // },
  // // vao 改进
  // vao2: function (gl, buffers, indices) {
  //   var vao;
  //   if (gl instanceof WebGL2RenderingContext) {
  //     vao = gl.createVertexArray();
  //     gl.bindVertexArray(vao);
  //   } else if (gl.ext) {
  //     vao = gl.ext.createVertexArrayOES();
  //     gl.ext.bindVertexArrayOES(vao);
  //   } else {
  //     console.warn('not support vao');
  //     return;
  //   }

  //   Object.keys(buffers).forEach((attrName) => {
  //     let bufferData = buffers[attrName];

  //     var index = gl.getAttribLocation(gl.program, bufferData.index);
  //     var buffer = gl.createBuffer();
  //     gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  //     gl.bufferData(gl.ARRAY_BUFFER, bufferData.data, gl.STATIC_DRAW);
  //     gl.vertexAttribPointer(
  //       index,
  //       bufferData.size,
  //       bufferData.type,
  //       bufferData.normalized,
  //       bufferData.stride,
  //       bufferData.offset
  //     ); // https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
  //     gl.enableVertexAttribArray(index);
  //     if (attrName === 'color' || attrName === 'instanced') {
  //       gl.vertexAttribDivisor(index, bufferData.divisor); // attribute used once per instance
  //     }
  //   });

  //   // index
  //   var indexBuffer = gl.createBuffer();
  //   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  //   gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  //   if (gl instanceof WebGL2RenderingContext) {
  //     gl.bindVertexArray(null);
  //   } else if (gl.ext) {
  //     gl.ext.bindVertexArrayOES(null);
  //   }
  //   return vao;
  // },
  // vao: function (gl, vertex, indices) {
  //   // vao
  //   var vao = gl.ext.createVertexArrayOES();
  //   gl.ext.bindVertexArrayOES(vao);

  //   // vertex
  //   var position = vertex.position;
  //   var index = gl.getAttribLocation(gl.program, position.index);
  //   var buffer = gl.createBuffer();
  //   gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  //   gl.bufferData(gl.ARRAY_BUFFER, position.vertices, gl.STATIC_DRAW);
  //   gl.vertexAttribPointer(
  //     index,
  //     position.size,
  //     position.type,
  //     position.normalized,
  //     position.stride,
  //     position.offset
  //   ); // https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
  //   gl.enableVertexAttribArray(index);

  //   // uv
  //   var position = uv.position;
  //   var index = gl.getAttribLocation(gl.program, position.index);
  //   var buffer = gl.createBuffer();
  //   gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  //   gl.bufferData(gl.ARRAY_BUFFER, position.vertices, gl.STATIC_DRAW);
  //   gl.vertexAttribPointer(
  //     index,
  //     position.size,
  //     position.type,
  //     position.normalized,
  //     position.stride,
  //     position.offset
  //   ); // https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
  //   gl.enableVertexAttribArray(index);

  //   // color
  //   var color = vertex.color;
  //   var index = gl.getAttribLocation(gl.program, color.index);
  //   var buffer = gl.createBuffer();
  //   gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  //   gl.bufferData(gl.ARRAY_BUFFER, color.vertices, gl.STATIC_DRAW);
  //   gl.vertexAttribPointer(
  //     index,
  //     color.size,
  //     color.type,
  //     color.normalized,
  //     color.stride,
  //     color.offset
  //   ); // https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
  //   gl.enableVertexAttribArray(index);

  //   // index
  //   var indexBuffer = gl.createBuffer();
  //   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  //   gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  //   gl.ext.bindVertexArrayOES(null);
  //   return vao;
  // },
  // texture: function (image) {
  //   var texture = gl.createTexture();
  //   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // 翻转 Y 轴
  //   gl.activeTexture(gl.TEXTURE0);
  //   gl.bindTexture(gl.TEXTURE_2D, texture);
  //   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  //   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  //   var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
  //   gl.uniform1i(u_Sampler, 0);
  // },
};
