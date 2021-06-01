import { vec3, quat, mat3, mat4 } from 'gl-matrix';
import { defineProperties } from '../util';
import Trigger from '../Trigger';
import BoundingBox from '../math/BoundingBox';
import { createVertexArray } from '../core/Geometries';
import VertexArray from '../core/VertexArray';

let dataId = 1,
  rotationMatrix = mat4.create();

export default class Data extends Trigger<Data> {
  id: number;
  private _modelMatrix: mat4;
  private _worldMatrix: mat4;
  private _normalMatrix: mat3;
  private _children: Array<Data>;
  private _position: vec3;
  private _scale: vec3;
  private _rotation: vec3;
  private _quaternion: quat;
  private _type: string;
  private _dirtyMatrix: boolean;
  private _dirtyWorldMatrix: boolean;
  private _dirtyPositionScaleRotation: boolean;
  private _lods: any;
  private _boundingBox: BoundingBox;
  private _childrenBoundingBox: BoundingBox;
  private _dirtyBoundingBox: boolean;
  private _dirtyChildrenBoundingBox: boolean;
  private _vao: VertexArray;
  private _material: any;

  public constructor() {
    super();
    this.id = dataId++;
    this._modelMatrix = mat4.create();
    this._worldMatrix = null;
    // TODO https://lxjk.github.io/2017/10/01/Stop-Using-Normal-Matrix.html
    this._normalMatrix = mat3.create();
    this._children = [];
    this._position = vec3.create();
    this._scale = vec3.fromValues(1, 1, 1);
    this._rotation = vec3.create();
    this._quaternion = quat.create();
    this._type = null;
    this._dirtyMatrix = false;
    this._dirtyWorldMatrix = false;
    this._dirtyPositionScaleRotation = false;
    this._lods = null;
    this._boundingBox = new BoundingBox();
    this._childrenBoundingBox = null;
    this._dirtyBoundingBox = true;
    this._dirtyChildrenBoundingBox = true;
    this._vao = null;
  }

  public get position(): vec3 {
    return this._position;
  }

  public set position(value: vec3) {
    const oldValue = this._position;
    this._position = value;
    this.firePropertyChanged('position', oldValue, value);
  }

  /**
   * return children
   */
  public get children(): Array<Data> {
    return this._children;
  }

  public get vao(): VertexArray {
    return this._vao;
  }

  addChild(child) {
    if (child.parent === this) {
      return;
    }
    child.parent = this;
  }

  _makeWorldMatrixDirty() {
    // this._dirtyWorldMatrix = true;
    // this._dirtyBoundingBox = true;
    // if (this.parent) {
    //   this.parent._dirtyChildrenBoundingBox = true;
    // }
    // if (this._children.length) {
    //   this._children.forEach((child) => {
    //     child._makeWorldMatrixDirty();
    //   });
    // }
  }

  _refreshModelMatrix() {
    let modelMatrix = this._modelMatrix;
    mat4.fromRotationTranslationScale(
      modelMatrix,
      this._quaternion,
      this._position,
      this._scale
    );
    mat3.normalFromMat4(this._normalMatrix, this._worldMatrix);
    return modelMatrix;
  }

  _refreshPositionScaleRotation() {
    let position = this._position,
      scale = this._scale,
      q = this._quaternion,
      mat = this._modelMatrix,
      sx,
      sy,
      sz;
    this._dirtyPositionScaleRotation = false;
    mat4.getTranslation(position, mat);
    mat4.getScaling(scale, mat);
    sx = 1 / scale[0];
    sy = 1 / scale[1];
    sz = 1 / scale[2];
    rotationMatrix[0] = mat[0] * sx;
    rotationMatrix[1] = mat[1] * sx;
    rotationMatrix[2] = mat[2] * sx;
    rotationMatrix[4] = mat[4] * sy;
    rotationMatrix[5] = mat[5] * sy;
    rotationMatrix[6] = mat[6] * sy;
    rotationMatrix[8] = mat[8] * sz;
    rotationMatrix[9] = mat[9] * sz;
    rotationMatrix[10] = mat[10] * sz;
    mat4.getRotation(q, rotationMatrix);

    this._refreshRotation();
  }

  _refreshRotation() {
    let q = this._quaternion,
      rotation = this._rotation,
      sqx = q[0] * q[0],
      sqy = q[1] * q[1],
      sqz = q[2] * q[2],
      sqw = q[3] * q[3];
    rotation[0] = Math.atan2(
      2 * (q[0] * q[3] + q[2] * q[1]),
      sqw - sqx - sqy + sqz
    );
    rotation[1] = Math.asin(
      Math.min(Math.max(2 * (q[1] * q[3] - q[0] * q[2]), -1), 1)
    );
    rotation[2] = Math.atan2(
      2 * (q[0] * q[1] + q[2] * q[3]),
      sqw + sqx - sqy - sqz
    );
  }

  _handleMaterialChange(e) {
    this.fire(e);
  }

  addLOD(distance, data) {
    let lods = this._lods,
      newLod = {
        distance,
        data,
      },
      i,
      n,
      lod;
    // TODO how to handle lod property change
    if (!lods) {
      this._lods = [newLod];
    } else {
      // big first, small last
      n = lods.length - 1;
      lod = lods[n];
      if (distance <= lod.distance) {
        lods.push(newLod);
      } else {
        for (i = 0; i <= n; i++) {
          lod = lods[i];
          if (distance >= lod.distance) {
            lods.splice(i, 0, newLod);
            break;
          }
        }
      }
    }
  }

  removeLOD(data) {
    let lods = this._lods;
    if (!lods) {
      return;
    }
    for (let i = lods.length - 1; i >= 0; i--) {
      let lod = lods[i];
      if (lod.data === data) {
        lods.splice(i, 1);
        break;
      }
    }
    if (!lods.length) {
      this._lods = null;
    }
  }

  getLOD(eye) {
    // TODO cache lod if eye not changed
    let lods = this._lods;
    if (!lods) {
      return this;
    }
    let distance = vec3.distance(eye, this._boundingBox.boundingSphere.center),
      i = 0,
      n = lods.length - 1,
      lod = lods[n];
    if (distance <= lod.distance) {
      return this;
    }
    for (; i <= n; i++) {
      lod = lods[i];
      if (distance >= lod.distance) {
        return lod.data;
      }
    }
    return null;
  }
  /*
    getLODMaterial (eye) {
      // TODO cache lod if eye not changed
      let this = this,
        material = this.material,
        lods = material && material._lods;
      if (!lods) {
        return material;
      }
      let distance = vec3.distance(eye, this._boundingBox.boundingSphere.center),
        i = 0,
        n = lods.length - 1,
        lod = lods[n];
      if (distance <= lod.distance) {
        return material;
      }
      for (; i <= n; i++) {
        lod = lods[i];
        if (distance >= lod.distance) {
          return lod.material;
        }
      }
    } */

  forEach(callback, descendant) {
    if (this._children.length === 0) {
      return;
    }
    this._children.forEach((child) => {
      callback(child);
      if (descendant) {
        child.forEach(callback, descendant);
      }
    });
  }

  public set type(t: string) {
    this._dirtyBoundingBox = true;
    if (this._type === t) {
      return;
    }
    let self = this,
      vao = createVertexArray(t);
    if (vao) {
      this._vao = vao;
      // TODO: Hack
      // if (vao._color) {
      //   if (!this.material) {
      //     this.material = new STDMaterial();
      //   }
      //   this.material.vertexColor = true;
      // } else if (this.material) {
      //   this.material.vertexColor = false;
      // }
    } else {
      this._vao = null;
    }
  }
}
