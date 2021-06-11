import { vec3 } from 'gl-matrix';
import { Frustum } from './Frustum';

/**
 * 包围球
 */
export class BoundingSphere {
  center: vec3;
  radius: number;

  constructor(center?: vec3, radius?: number) {
    this.center = center || vec3.create();
    this.radius = radius || 0;
  }

  isInFrustum(frustum: Frustum) {
    let { planes } = frustum,
      { radius, center } = this;
    for (let i = 0; i < 6; i++) {
      let plane = planes[i];
      if (vec3.dot(plane, center) + plane[3] <= -radius) {
        return false;
      }
    }
    return true;
  }

  intersect(other: BoundingSphere) {
    return (
      vec3.distance(this.center, other.center) <= this.radius + other.radius
    );
  }

  containPoint(point: vec3) {
    return vec3.distance(point, this.center) <= this.radius;
  }
}
