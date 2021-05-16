export const WebGLAPI = {
  clearColor: [0.0, 0.0, 0.0, 1.0],
  dirty: true,
  pointSize: 100.0,
  //https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawArrays
  // void gl.drawArrays(mode, first, count);
  drawArrays: {
    enable: false,
    mode: 'POINTS', // A GLenum specifying the type primitive to render. Possible values are: ['POINTS','LINE_STRIP','LINE_LOOP','LINES','TRIANGLE_STRIP','TRIANGLE_FAN','TRIANGLES']
    first: 0, // A GLint specifying the starting index in the array of vector points.
    count: 0, // A GLsizei specifying the number of indices to be rendered.
  },
  // https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/drawElements
  drawElements: {
    enable: false,
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
  },
  drawArraysInstanced: {
    mode: 'POINTS', // A GLenum specifying the type primitive to render. Possible values are:
    first: 0, // A GLint specifying the starting index in the array of vector points.
    count: 1, // A GLsizei specifying the number of indices to be rendered.
    instanceCount: 0, // A GLsizei specifying the number of instances of the range of elements to execute.
    divisor: 1,
  },
};
