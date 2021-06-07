import { vec3 } from 'gl-matrix';

export class BoundingSphere {
  center: vec3;
  radius: number;

  constructor(center?, radius?) {
    this.center = center || vec3.create();
    this.radius = radius || 0;
  }

  isInFrustum(frustum) {
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

  intersect(other) {
    return (
      vec3.distance(this.center, other.center) <= this.radius + other.radius
    );
  }

  containPoint(point) {
    return vec3.distance(point, this.center) <= this.radius;
  }
}
