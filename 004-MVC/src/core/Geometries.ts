import { ReadonlyVec3, vec2, vec3 } from 'gl-matrix';
import VertexArray from './VertexArray';

let geometries = {},
  vaos = {};

// indices have to be completely defined NO TRIANGLE_STRIP only TRIANGLES
// TODO: stride
export function calculateNormals(vs, ind) {
  let x = 0;
  let y = 1;
  let z = 2;
  let v1 = [];
  let v2 = [];
  let normal = [];

  let ns = [];
  let i;
  for (i = 0; i < vs.length; i += 3) {
    // for each vertex, initialize normal x, normal y, normal z
    ns[i + x] = 0.0;
    ns[i + y] = 0.0;
    ns[i + z] = 0.0;
  }

  if (ind) {
    // we work on triads of vertices to calculate normals so i = i+3 (i = indices index)
    for (i = 0; i < ind.length; i += 3) {
      // p2 - p1
      v1[x] = vs[3 * ind[i + 2] + x] - vs[3 * ind[i + 1] + x];
      v1[y] = vs[3 * ind[i + 2] + y] - vs[3 * ind[i + 1] + y];
      v1[z] = vs[3 * ind[i + 2] + z] - vs[3 * ind[i + 1] + z];
      // p0 - p1
      v2[x] = vs[3 * ind[i] + x] - vs[3 * ind[i + 1] + x];
      v2[y] = vs[3 * ind[i] + y] - vs[3 * ind[i + 1] + y];
      v2[z] = vs[3 * ind[i] + z] - vs[3 * ind[i + 1] + z];
      // cross product by Sarrus Rule
      normal[x] = v1[y] * v2[z] - v1[z] * v2[y];
      normal[y] = v1[z] * v2[x] - v1[x] * v2[z];
      normal[z] = v1[x] * v2[y] - v1[y] * v2[x];
      for (let j = 0; j < 3; j++) {
        // update the normals of that triangle: sum of vectors
        ns[3 * ind[i + j] + x] += normal[x];
        ns[3 * ind[i + j] + y] += normal[y];
        ns[3 * ind[i + j] + z] += normal[z];
      }
    }
  } else {
    for (i = 0; i < vs.length; i += 9) {
      // p2 - p1
      v1[x] = vs[i + 6 + x] - vs[i + 3 + x];
      v1[y] = vs[i + 6 + y] - vs[i + 3 + y];
      v1[z] = vs[i + 6 + z] - vs[i + 3 + z];
      // p0 - p1
      v2[x] = vs[i + x] - vs[i + 3 + x];
      v2[y] = vs[i + y] - vs[i + 3 + y];
      v2[z] = vs[i + z] - vs[i + 3 + z];
      // cross product by Sarrus Rule
      normal[x] = v1[y] * v2[z] - v1[z] * v2[y];
      normal[y] = v1[z] * v2[x] - v1[x] * v2[z];
      normal[z] = v1[x] * v2[y] - v1[y] * v2[x];
      for (let j = 0; j < 3; j++) {
        // update the normals of that triangle: sum of vectors
        ns[i + j * 3 + x] += normal[x];
        ns[i + j * 3 + y] += normal[y];
        ns[i + j * 3 + z] += normal[z];
      }
    }
  }
  // normalize the result
  for (i = 0; i < vs.length; i += 3) {
    // the increment here is because each vertex occurs with an offset of 3 in the array
    // (due to x, y, z contiguous values)

    normal[x] = ns[i + x];
    normal[y] = ns[i + y];
    normal[z] = ns[i + z];

    let n: ReadonlyVec3 = vec3.fromValues(normal[x], normal[y], normal[z]);
    let len = vec3.length(n);
    if (len === 0) {
      len = 1.0;
    }

    ns[i + x] = normal[x] / len;
    ns[i + y] = normal[y] / len;
    ns[i + z] = normal[z] / len;
  }

  return new Float32Array(ns);
}

export function calculateTangent(geometry) {
  let indices = geometry.index,
    uvs = geometry.uv.data || geometry.uv,
    vertices = geometry.position.data || geometry.position,
    tangents = [],
    gtangent = [],
    v0 = vec3.create(),
    v1 = vec3.create(),
    v2 = vec3.create(),
    u0 = vec2.create(),
    u1 = vec2.create(),
    u2 = vec2.create(),
    edge1 = vec3.create(),
    edge2 = vec3.create(),
    tangent = vec3.create(),
    i,
    n;
  for (i = 0, n = vertices.length / 3; i < n; i++) {
    tangents[i] = vec3.create();
  }
  for (i = 0, n = indices.length; i < n; i += 3) {
    let i0 = indices[i];
    let i1 = indices[i + 1];
    let i2 = indices[i + 2];

    vec3.set(v0, vertices[i0 * 3], vertices[i0 * 3 + 1], vertices[i0 * 3 + 2]);
    vec3.set(v1, vertices[i1 * 3], vertices[i1 * 3 + 1], vertices[i1 * 3 + 2]);
    vec3.set(v2, vertices[i2 * 3], vertices[i2 * 3 + 1], vertices[i2 * 3 + 2]);

    vec3.subtract(edge1, v1, v0);
    vec3.subtract(edge2, v2, v0);

    vec2.set(u0, uvs[i0 * 2], uvs[i0 * 2 + 1]);
    vec2.set(u1, uvs[i1 * 2], uvs[i1 * 2 + 1]);
    vec2.set(u2, uvs[i2 * 2], uvs[i2 * 2 + 1]);

    let deltaU1 = u1[0] - u0[0];
    let deltaV1 = u1[1] - u0[1];
    let deltaU2 = u2[0] - u0[0];
    let deltaV2 = u2[1] - u0[1];

    let f = 1.0 / (deltaU1 * deltaV2 - deltaU2 * deltaV1);

    vec3.set(
      tangent,
      f * (deltaV2 * edge1[0] - deltaV1 * edge2[0]),
      f * (deltaV2 * edge1[1] - deltaV1 * edge2[1]),
      f * (deltaV2 * edge1[2] - deltaV1 * edge2[2])
    );

    vec3.add(tangents[i0], tangents[i0], tangent);
    vec3.add(tangents[i1], tangents[i1], tangent);
    vec3.add(tangents[i2], tangents[i2], tangent);
  }

  for (i = 0, n = tangents.length; i < n; i++) {
    vec3.normalize(tangents[i], tangents[i]);
    // TODO: Calculate handedness
    // http://www.terathon.com/code/tangent.html
    // https://www.haroldserrano.com/blog/how-to-apply-a-normal-map-in-opengl
    // http://www.sunandblackcat.com/tipFullView.php?l=eng&topicid=7&topic=Normal-Mapping
    // http://www.sunandblackcat.com/tipFullView.php?l=eng&topicid=8&topic=Tangent-Bitangent-Vectors
    // https://github.com/spazzarama/Direct3D-Rendering-Cookbook/blob/master/Ch08_01Physics/Shaders/Common.hlsl
    gtangent.push(tangents[i][0], tangents[i][1], tangents[i][2], 1);
  }
  return new Float32Array(gtangent);
}

export function calculateBarycentric(geometry) {
  let indices = geometry.index,
    uvs = geometry.uv.data || geometry.uv,
    vertices = geometry.position.data || geometry.position,
    normals = geometry.normal.data || geometry.normal,
    tangents = geometry.tangent.data || geometry.tangent,
    newUv = [],
    newPosition = [],
    newNormal = [],
    newTangent = [],
    barycentric = [];
  for (let i = 0, n = indices.length; i < n; i++) {
    let index = indices[i];
    newUv.push(uvs[index * 2], uvs[index * 2 + 1]);
    newPosition.push(
      vertices[index * 3],
      vertices[index * 3 + 1],
      vertices[index * 3 + 2]
    );
    newNormal.push(
      normals[index * 3],
      normals[index * 3 + 1],
      normals[index * 3 + 2]
    );
    newTangent.push(
      tangents[index * 4],
      tangents[index * 4 + 1],
      tangents[index * 4 + 2],
      tangents[index * 4 + 3]
    );
    if (i % 3 === 0) {
      barycentric.push(1, 0, 0);
    } else if (i % 3 === 1) {
      barycentric.push(0, 1, 0);
    } else {
      barycentric.push(0, 0, 1);
    }
  }
  return {
    uv: new Float32Array(newUv),
    position: new Float32Array(newPosition),
    normal: new Float32Array(newNormal),
    tangent: new Float32Array(newTangent),
    barycentric: new Float32Array(barycentric),
  };
}

export function addGeometry(name, geometry) {
  // TODO should not generate auto, if no normal, then no lights
  let { buffers } = geometry;
  if (!buffers.normal) {
    buffers.normal = calculateNormals(buffers.position, buffers.index);
  }
  if (buffers.position0 && !buffers.normal0) {
    buffers.normal0 = calculateNormals(buffers.position0, buffers.index);
  }
  // TODO tangent0, barycentric0
  if (!buffers.tangent && buffers.uv) {
    buffers.tangent = calculateTangent(buffers);
  }
  if (buffers.tangent) {
    buffers = calculateBarycentric(buffers);
  }
  geometry.buffers = buffers;
  geometries[name] = geometry;
  return geometry;
}

// TODO: move to Scene
export function createVertexArray(name) {
  let vao = vaos[name];
  if (!vao) {
    let geometry = geometries[name];
    if (geometry) {
      vao = vaos[name] = new VertexArray(geometry);
    }
  }
  return vao;
}

export function disposeVertexArrays() {
  Object.keys(vaos).forEach((name) => {
    vaos[name].dispose();
  });
}

export function createCube(size = 1) {
  let hs = size * 0.5;
  let pos = new Float32Array([
    -hs,
    -hs,
    hs,
    hs,
    -hs,
    hs,
    hs,
    hs,
    hs,
    -hs,
    hs,
    hs, // front
    -hs,
    -hs,
    -hs,
    -hs,
    hs,
    -hs,
    hs,
    hs,
    -hs,
    hs,
    -hs,
    -hs, // back
    -hs,
    hs,
    -hs,
    -hs,
    hs,
    hs,
    hs,
    hs,
    hs,
    hs,
    hs,
    -hs, // top
    -hs,
    -hs,
    -hs,
    hs,
    -hs,
    -hs,
    hs,
    -hs,
    hs,
    -hs,
    -hs,
    hs, // bottom
    hs,
    -hs,
    -hs,
    hs,
    hs,
    -hs,
    hs,
    hs,
    hs,
    hs,
    -hs,
    hs, // right
    -hs,
    -hs,
    -hs,
    -hs,
    -hs,
    hs,
    -hs,
    hs,
    hs,
    -hs,
    hs,
    -hs, // left
  ]);
  let nor = new Float32Array([
    0.0,
    0.0,
    1.0,
    0.0,
    0.0,
    1.0,
    0.0,
    0.0,
    1.0,
    0.0,
    0.0,
    1.0, // front
    0.0,
    0.0,
    -1.0,
    0.0,
    0.0,
    -1.0,
    0.0,
    0.0,
    -1.0,
    0.0,
    0.0,
    -1.0, // back
    0.0,
    1.0,
    0.0,
    0.0,
    1.0,
    0.0,
    0.0,
    1.0,
    0.0,
    0.0,
    1.0,
    0.0, // up
    0.0,
    -1.0,
    0.0,
    0.0,
    -1.0,
    0.0,
    0.0,
    -1.0,
    0.0,
    0.0,
    -1.0,
    0.0, // down
    1.0,
    0.0,
    0.0,
    1.0,
    0.0,
    0.0,
    1.0,
    0.0,
    0.0,
    1.0,
    0.0,
    0.0, // right
    -1.0,
    0.0,
    0.0,
    -1.0,
    0.0,
    0.0,
    -1.0,
    0.0,
    0.0,
    -1.0,
    0.0,
    0.0, // left
  ]);
  // let nor = new Float32Array([
  //   -1.0, -1.0,  1.0,  1.0, -1.0,  1.0,  1.0,  1.0,  1.0, -1.0,  1.0,  1.0,
  //   -1.0, -1.0, -1.0, -1.0,  1.0, -1.0,  1.0,  1.0, -1.0,  1.0, -1.0, -1.0,
  //   -1.0,  1.0, -1.0, -1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0, -1.0,
  //   -1.0, -1.0, -1.0,  1.0, -1.0, -1.0,  1.0, -1.0,  1.0, -1.0, -1.0,  1.0,
  //    1.0, -1.0, -1.0,  1.0,  1.0, -1.0,  1.0,  1.0,  1.0,  1.0, -1.0,  1.0,
  //   -1.0, -1.0, -1.0, -1.0, -1.0,  1.0, -1.0,  1.0,  1.0, -1.0,  1.0, -1.0
  // ]);
  let st = new Float32Array([
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0,
    1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0,
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0,
    1.0, 0.0, 1.0,
  ]);
  let idx = [
    0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14,
    15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23,
  ];
  return {
    position: pos,
    normal: nor,
    uv: st,
    index: idx,
  };
}

export function createTorus(row, column, irad, orad) {
  let pos = [],
    nor = [],
    st = [],
    idx = [],
    i,
    ii,
    r;
  for (i = 0; i <= row; i++) {
    r = ((Math.PI * 2) / row) * i;
    let rr = Math.cos(r);
    let ry = Math.sin(r);
    for (ii = 0; ii <= column; ii++) {
      let tr = ((Math.PI * 2) / column) * ii;
      let tx = (rr * irad + orad) * Math.cos(tr);
      let ty = ry * irad;
      let tz = (rr * irad + orad) * Math.sin(tr);
      let rx = rr * Math.cos(tr);
      let rz = rr * Math.sin(tr);
      let rs = (1 / column) * ii;
      let rt = (1 / row) * i + 0.5;
      if (rt > 1.0) {
        rt -= 1.0;
      }
      rt = 1.0 - rt;
      pos.push(tx, ty, tz);
      nor.push(rx, ry, rz);
      st.push(rs, rt);
    }
  }
  for (i = 0; i < row; i++) {
    for (ii = 0; ii < column; ii++) {
      r = (column + 1) * i + ii;
      idx.push(r, r + column + 1, r + 1);
      idx.push(r + column + 1, r + column + 2, r + 1);
    }
  }
  return {
    position: new Float32Array(pos),
    normal: new Float32Array(nor),
    uv: new Float32Array(st),
    index: idx,
  };
}

export function createSphere(
  radius,
  widthSegments,
  heightSegments,
  phiStart?,
  phiLength?,
  thetaStart?,
  thetaLength?
) {
  radius = radius || 1;

  widthSegments = Math.max(3, Math.floor(widthSegments) || 8);
  heightSegments = Math.max(2, Math.floor(heightSegments) || 6);

  phiStart = phiStart !== undefined ? phiStart : 0;
  phiLength = phiLength !== undefined ? phiLength : Math.PI * 2;

  thetaStart = thetaStart !== undefined ? thetaStart : 0;
  thetaLength = thetaLength !== undefined ? thetaLength : Math.PI;

  let thetaEnd = thetaStart + thetaLength;

  let index = 0;
  let grid = [];

  let vertex = vec3.create();
  let normal = vec3.create();

  let indices = [];
  let vertices = [];
  let normals = [];
  let uvs = [];

  for (let iy = 0; iy <= heightSegments; iy++) {
    let verticesRow = [];
    let v = iy / heightSegments;
    for (let ix = 0; ix <= widthSegments; ix++) {
      let u = ix / widthSegments;

      vertex[0] =
        -radius *
        Math.cos(phiStart + u * phiLength) *
        Math.sin(thetaStart + v * thetaLength);
      vertex[1] = radius * Math.cos(thetaStart + v * thetaLength);
      vertex[2] =
        radius *
        Math.sin(phiStart + u * phiLength) *
        Math.sin(thetaStart + v * thetaLength);

      vertices.push(vertex[0], vertex[1], vertex[2]);
      vec3.normalize(normal, vertex);
      normals.push(normal[0], normal[1], normal[2]);
      uvs.push(u, 1 - v);
      verticesRow.push(index++);
    }
    grid.push(verticesRow);
  }

  for (let iy = 0; iy < heightSegments; iy++) {
    for (let ix = 0; ix < widthSegments; ix++) {
      let a = grid[iy][ix + 1];
      let b = grid[iy][ix];
      let c = grid[iy + 1][ix];
      let d = grid[iy + 1][ix + 1];

      if (iy !== 0 || thetaStart > 0) {
        indices.push(a, b, d);
      }
      if (iy !== heightSegments - 1 || thetaEnd < Math.PI) {
        indices.push(b, c, d);
      }
    }
  }

  return {
    position: new Float32Array(vertices),
    normal: new Float32Array(normals),
    uv: new Float32Array(uvs),
    index: indices,
  };
}

export function createTruncatedCone(
  bottomRadius,
  topRadius,
  height,
  radialSubdivisions,
  verticalSubdivisions,
  optTopCap,
  optBottomCap
) {
  if (radialSubdivisions < 3) {
    radialSubdivisions = 3;
  }

  if (verticalSubdivisions < 1) {
    verticalSubdivisions = 3;
  }

  let topCap = optTopCap === undefined ? true : optTopCap;
  let bottomCap = optBottomCap === undefined ? true : optBottomCap;

  let extra = (topCap ? 2 : 0) + (bottomCap ? 2 : 0);

  let positions = [];
  let normals = [];
  let texCoords = [];
  let indices = [];

  let vertsAroundEdge = radialSubdivisions + 1;

  // The slant of the cone is constant across its surface
  let slant = Math.atan2(bottomRadius - topRadius, height);
  let cosSlant = Math.cos(slant);
  let sinSlant = Math.sin(slant);

  let start = topCap ? -2 : 0;
  let end = verticalSubdivisions + (bottomCap ? 2 : 0);

  for (let yy = start; yy <= end; ++yy) {
    let v = yy / verticalSubdivisions;
    let y = height * v;
    let ringRadius;
    if (yy < 0) {
      y = 0;
      v = 1;
      ringRadius = bottomRadius;
    } else if (yy > verticalSubdivisions) {
      y = height;
      v = 1;
      ringRadius = topRadius;
    } else {
      ringRadius =
        bottomRadius + (topRadius - bottomRadius) * (yy / verticalSubdivisions);
    }
    if (yy === -2 || yy === verticalSubdivisions + 2) {
      ringRadius = 0;
      v = 0;
    }
    y -= height / 2;
    for (let ii = 0; ii < vertsAroundEdge; ++ii) {
      let sin = Math.sin((ii * Math.PI * 2) / radialSubdivisions);
      let cos = Math.cos((ii * Math.PI * 2) / radialSubdivisions);
      positions.push(sin * ringRadius, y, cos * ringRadius);
      normals.push(
        yy < 0 || yy > verticalSubdivisions ? 0 : sin * cosSlant,
        yy < 0 ? -1 : yy > verticalSubdivisions ? 1 : sinSlant,
        yy < 0 || yy > verticalSubdivisions ? 0 : cos * cosSlant
      );
      texCoords.push(ii / radialSubdivisions, 1 - v);
    }
  }

  for (let yy = 0; yy < verticalSubdivisions + extra; ++yy) {
    for (let ii = 0; ii < radialSubdivisions; ++ii) {
      indices.push(
        vertsAroundEdge * (yy + 0) + 0 + ii,
        vertsAroundEdge * (yy + 0) + 1 + ii,
        vertsAroundEdge * (yy + 1) + 1 + ii
      );
      indices.push(
        vertsAroundEdge * (yy + 0) + 0 + ii,
        vertsAroundEdge * (yy + 1) + 1 + ii,
        vertsAroundEdge * (yy + 1) + 0 + ii
      );
    }
  }

  return {
    position: new Float32Array(positions),
    normal: new Float32Array(normals),
    uv: new Float32Array(texCoords),
    index: indices,
  };
}

/**
 * Create Plane geometry
 * @param  {Number} width          width of plane
 * @param  {Number} height         height of plane
 * @param  {Number} widthSegments  horizonal segments of plane
 * @param  {Number} heightSegments vertical segments of plane
 * @return {Object}                return plane geometry
 * @memberOf Util
 */
export function createPlane(width, height, widthSegments, heightSegments) {
  width = width || 1;
  height = height || 1;

  let widthHalf = width / 2;
  let heightHalf = height / 2;

  let gridX = Math.floor(widthSegments) || 1;
  let gridY = Math.floor(heightSegments) || 1;

  let gridX1 = gridX + 1;
  let gridY1 = gridY + 1;

  let segmentWidth = width / gridX;
  let segmentHeight = height / gridY;

  let indices = [];
  let vertices = [];
  let normals = [];
  let uvs = [];

  for (let iy = 0; iy < gridY1; iy++) {
    let y = iy * segmentHeight - heightHalf;
    for (let ix = 0; ix < gridX1; ix++) {
      let x = ix * segmentWidth - widthHalf;
      vertices.push(x, -y, 0);
      normals.push(0, 0, 1);
      uvs.push(ix / gridX, 1 - iy / gridY);
    }
  }

  for (let iy = 0; iy < gridY; iy++) {
    for (let ix = 0; ix < gridX; ix++) {
      let a = ix + gridX1 * iy;
      let b = ix + gridX1 * (iy + 1);
      let c = ix + 1 + gridX1 * (iy + 1);
      let d = ix + 1 + gridX1 * iy;
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  return {
    position: new Float32Array(vertices),
    normal: new Float32Array(normals),
    uv: new Float32Array(uvs),
    index: indices,
  };
}

addGeometry('Cube', { buffers: createCube(1) });
addGeometry('Torus', { buffers: createTorus(32, 32, 0.25, 0.5) });
addGeometry('Sphere', { buffers: createSphere(0.5, 32, 32) });
addGeometry('Cone', {
  buffers: createTruncatedCone(0.5, 0, 1, 32, 32, true, true),
});
addGeometry('Cylinder', {
  buffers: createTruncatedCone(0.5, 0.5, 1, 32, 32, true, true),
});
addGeometry('Plane', { buffers: createPlane(2, 2, 1, 1) });
