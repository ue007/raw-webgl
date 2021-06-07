import { glMatrix, mat4, vec3 } from 'gl-matrix';
import { BoundingSphere } from './BoundingSphere';
import { Frustum } from './Frustum';

let tempMin = [0, 0, 0],
  tempMax = [0, 0, 0],
  tempPoints = new Array(12);

export class BoundingBox {
  _rawPoints: Float32Array;
  _points: Array<number>;
  _halfSize: Array<number>;
  min: vec3;
  max: vec3;
  boundingSphere: BoundingSphere;

  constructor(min?: vec3, max?: vec3) {
    let rawPoints = (this._rawPoints = new Float32Array(24)),
      points = (this._points = new Array(8));
    this._halfSize = new Array(3);
    for (let i = 0; i < 8; i++) {
      points[i] = new Float32Array(rawPoints.buffer, i * 12, 3);
    }
    [this.min, this.max] = [points[0], points[4]];
    this.boundingSphere = new BoundingSphere();
    if (min) {
      this.reset(min, max);
    }
  }

  reset(min?: vec3, max?: vec3) {
    let points = this._points,
      _min = this.min,
      _max = this.max,
      halfSize = this._halfSize;
    if (min) {
      vec3.copy(_min, min);
    }
    if (max) {
      vec3.copy(_max, max);
    }
    halfSize[0] = (_max[0] - _min[0]) / 2;
    halfSize[1] = (_max[1] - _min[1]) / 2;
    halfSize[2] = (_max[2] - _min[2]) / 2;
    let readonlyHalfSize: vec3 = vec3.fromValues(
      halfSize[0],
      halfSize[1],
      halfSize[2]
    );
    this.boundingSphere.radius = vec3.length(readonlyHalfSize);
    vec3.add(this.boundingSphere.center, _min, readonlyHalfSize);

    [points[1][0], points[2][1], points[3][2]] = _max;
    [points[6][0], points[5][1], points[5][2]] = _max;
    [points[7][0], points[7][1], points[6][2]] = _max;
    [points[2][0], points[1][1], points[1][2]] = _min;
    [points[3][0], points[3][1], points[2][2]] = _min;
    [points[5][0], points[6][1], points[7][2]] = _min;
  }

  union(boundingBox: BoundingBox) {
    if (boundingBox.isEmpty()) {
      return;
    }
    if (this.isEmpty()) {
      this.reset(boundingBox.min, boundingBox.max);
    } else {
      [tempPoints[0], tempPoints[1], tempPoints[2]] = this.min;
      [tempPoints[3], tempPoints[4], tempPoints[5]] = this.max;
      [tempPoints[6], tempPoints[7], tempPoints[8]] = boundingBox.min;
      [tempPoints[9], tempPoints[10], tempPoints[11]] = boundingBox.max;
      this.fromPoints(tempPoints);
    }
  }

  transform(matrix: any, source: any) {
    BoundingBox.transform(matrix, source || this, this);
  }

  fromPoints(points: any) {
    BoundingBox.fromPoints(points, this);
  }

  isEmpty() {
    return this.boundingSphere.radius <= 0;
  }

  isInFrustum(frustum: Frustum) {
    let { planes } = frustum,
      points = this._points;
    if (!this.boundingSphere.intersect(frustum.boundingSphere)) {
      return false;
    }
    if (!this.boundingSphere.isInFrustum(frustum)) {
      return false;
    }
    for (let i = 0; i < 6; i++) {
      let plane = planes[i];
      let inCount = 8;
      for (let j = 0; j < 8; j++) {
        let p: vec3 = vec3.fromValues(points[j][0], points[j][1], points[j][2]);
        if (vec3.dot(plane, p) + plane[3] < 0) {
          inCount--;
        } else {
          break;
        }
      }
      if (!inCount) {
        return false;
      }
    }
    return true;
  }

  static transform(matrix: mat4, source: vec3 | number[], target: any) {
    if (!target) {
      target = new BoundingBox();
    }
    for (let i = 0; i < 8; i++) {
      vec3.transformMat4(target._points[i], source._points[i], matrix);
    }
    BoundingBox.fromPoints(target._rawPoints, target);
    return target;
  }

  static fromPoints(points, target?) {
    vec3.set(
      vec3.fromValues(tempMin[0], tempMin[1], tempMin[2]),
      points[0],
      points[1],
      points[2]
    );
    vec3.set(
      vec3.fromValues(tempMax[0], tempMax[1], tempMax[2]),
      points[0],
      points[1],
      points[2]
    );
    for (let i = 3, n = points.length; i < n; i += 3) {
      if (points[i] < tempMin[0]) {
        tempMin[0] = points[i];
      }
      if (points[i + 1] < tempMin[1]) {
        tempMin[1] = points[i + 1];
      }
      if (points[i + 2] < tempMin[2]) {
        tempMin[2] = points[i + 2];
      }
      if (points[i] > tempMax[0]) {
        tempMax[0] = points[i];
      }
      if (points[i + 1] > tempMax[1]) {
        tempMax[1] = points[i + 1];
      }
      if (points[i + 2] > tempMax[2]) {
        tempMax[2] = points[i + 2];
      }
    }

    if (target) {
      target.reset(tempMin, tempMax);
    } else {
      target = new BoundingBox(
        vec3.fromValues(tempMin[0], tempMin[1], tempMin[2]),
        vec3.fromValues(tempMax[0], tempMax[1], tempMax[2])
      );
    }
    return target;
  }
}
