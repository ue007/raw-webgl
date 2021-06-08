import { vec3, vec4 } from 'gl-matrix';
import { BoundingSphere } from './BoundingSphere';

let look = vec3.create(),
  up = vec3.create(),
  right = vec3.create(),
  cN = vec3.create(),
  cF = vec3.create(),
  cR = vec3.create(),
  cU = vec3.create();

export class Frustum {
  planes: Array<vec4>;
  points: Array<vec3>;
  boundingSphere: BoundingSphere;
  constructor() {
    this.planes = [
      vec4.create(),
      vec4.create(),
      vec4.create(),
      vec4.create(),
      vec4.create(),
      vec4.create(),
    ];
    this.points = [
      vec3.create(),
      vec3.create(),
      vec3.create(),
      vec3.create(),
      vec3.create(),
      vec3.create(),
      vec3.create(),
      vec3.create(),
    ];
    this.boundingSphere = new BoundingSphere();
  }

  // fromMatrix(camera) {
  //   let mat = camera.projectViewMatrix,
  //     { planes } = this;
  //   // http://www.lighthouse3d.com/tutorials/view-frustum-culling/clip-space-approach-extracting-the-planes/
  //   // Near
  //   vec4.set(
  //     planes[0],
  //     mat[3] + mat[2],
  //     mat[7] + mat[6],
  //     mat[11] + mat[10],
  //     mat[15] + mat[14]
  //   );
  //   // Far
  //   vec4.set(
  //     planes[1],
  //     mat[3] - mat[2],
  //     mat[7] - mat[6],
  //     mat[11] - mat[10],
  //     mat[15] - mat[14]
  //   );
  //   // Left
  //   vec4.set(
  //     planes[2],
  //     mat[3] + mat[0],
  //     mat[7] + mat[4],
  //     mat[11] + mat[8],
  //     mat[15] + mat[12]
  //   );
  //   // Right
  //   vec4.set(
  //     planes[3],
  //     mat[3] - mat[0],
  //     mat[7] - mat[4],
  //     mat[11] - mat[8],
  //     mat[15] - mat[12]
  //   );
  //   // Top
  //   vec4.set(
  //     planes[4],
  //     mat[3] - mat[1],
  //     mat[7] - mat[5],
  //     mat[11] - mat[9],
  //     mat[15] - mat[13]
  //   );
  //   // Bottom
  //   vec4.set(
  //     planes[5],
  //     mat[3] + mat[1],
  //     mat[7] + mat[5],
  //     mat[11] + mat[9],
  //     mat[15] + mat[13]
  //   );
  //   planes.forEach((plane) => {
  //     let p: vec3 = vec3.fromValues(plane[0], plane[1], plane[2]);
  //     vec4.scale(plane, plane, 1 / vec3.length(p));
  //   });

  //   // https://lxjk.github.io/2017/04/15/Calculate-Minimal-Bounding-Sphere-of-Frustum.html
  //   let { near, far, aspect } = camera,
  //     tanHalfFovy = Math.tan(((camera.fovy / 180) * Math.PI) / 2),
  //     d1 = far + near,
  //     d2 = far - near,
  //     k = Math.sqrt(1 + (1 / aspect) ** 2) * tanHalfFovy * aspect,
  //     k2 = k * k,
  //     { boundingSphere } = this;

  //   if (k2 >= d2 / d1) {
  //     vec3.set(boundingSphere.center, 0, 0, -far);
  //     boundingSphere.radius = far * k;
  //   } else {
  //     vec3.set(boundingSphere.center, 0, 0, -0.5 * d1 * (1 + k2));
  //     boundingSphere.radius =
  //       0.5 *
  //       Math.sqrt(
  //         d2 * d2 + 2 * (far * far + near * near) * k2 + d1 * d1 * k2 * k2
  //       );
  //   }
  //   vec3.transformMat4(
  //     boundingSphere.center,
  //     boundingSphere.center,
  //     camera.worldMatrix
  //   );

  //   // http://www.lighthouse3d.com/tutorials/view-frustum-culling/geometric-approach-implementation/
  //   let { position } = camera,
  //     { points } = this,
  //     halfNearHeight = tanHalfFovy * near,
  //     halfNearWidth = halfNearHeight * aspect,
  //     halfFarHeight = tanHalfFovy * far,
  //     halfFarWidth = halfFarHeight * aspect;

  //   vec3.sub(look, position, camera.target);
  //   vec3.normalize(look, look);
  //   vec3.cross(right, camera._up, look);
  //   vec3.normalize(right, right);

  //   vec3.cross(up, look, right);

  //   vec3.copy(cN, look);
  //   vec3.scale(cN, cN, -near);
  //   vec3.add(cN, cN, position);

  //   vec3.copy(cF, look);
  //   vec3.scale(cF, cF, -far);
  //   vec3.add(cF, cF, position);

  //   // near
  //   vec3.copy(cR, right);
  //   vec3.scale(cR, cR, halfNearWidth);
  //   vec3.copy(cU, up);
  //   vec3.scale(cU, cU, halfNearHeight);

  //   vec3.add(points[0], cN, cU);
  //   vec3.sub(points[0], points[0], cR);

  //   vec3.sub(points[1], cN, cU);
  //   vec3.sub(points[1], points[1], cR);

  //   vec3.sub(points[2], cN, cU);
  //   vec3.add(points[2], points[2], cR);

  //   vec3.add(points[3], cN, cU);
  //   vec3.add(points[3], points[3], cR);

  //   // far
  //   vec3.copy(cR, right);
  //   vec3.scale(cR, cR, halfFarWidth);
  //   vec3.copy(cU, up);
  //   vec3.scale(cU, cU, halfFarHeight);

  //   vec3.add(points[4], cF, cU);
  //   vec3.sub(points[4], points[4], cR);

  //   vec3.sub(points[5], cF, cU);
  //   vec3.sub(points[5], points[5], cR);

  //   vec3.sub(points[6], cF, cU);
  //   vec3.add(points[6], points[6], cR);

  //   vec3.add(points[7], cF, cU);
  //   vec3.add(points[7], points[7], cR);

  //   /* // another implements
  //   // near face
  //   vec3.set(points[0], -halfNearWidth, halfNearHeight, -near);
  //   vec3.set(points[1], -halfNearWidth,  -halfNearHeight, -near);
  //   vec3.set(points[2], halfNearWidth,  -halfNearHeight, -near);
  //   vec3.set(points[3], halfNearWidth, halfNearHeight, -near);

  //   // far face
  //   vec3.set(points[4], -halfFarWidth,   halfFarHeight, -far);
  //   vec3.set(points[5], -halfFarWidth,  -halfFarHeight, -far);
  //   vec3.set(points[6], halfFarWidth,  -halfFarHeight, -far);
  //   vec3.set(points[7], halfFarWidth, halfFarHeight, -far);

  //   for (let i = 0; i < 8; i++) {
  //     vec3.transformMat4(points[i], points[i], camera.worldMatrix);
  //   }

  //   console.log(points.map(function (point) {
  //     return 'Vec3(' + point[0] + ', ' + point[1] + ', ' + point[2] + ')';
  //   }).join('\n')); */
  // }
}
