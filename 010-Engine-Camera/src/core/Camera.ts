import { vec3, mat4 } from 'gl-matrix';
import Trigger from './base/Trigger';
import { Frustum } from './math/Frustum';
import { getClientPoint } from './utils/util';

const tempVec = vec3.create();

export default class Camera extends Trigger<Camera> {
  private _viewMatrix: mat4;
  private _worldMatrix: mat4;
  private _projectMatrix: mat4;
  private _projectViewMatrix: mat4;
  private _rotateMatrix: mat4;
  private _viewDirty: boolean;
  private _projectDirty: boolean;
  private _frustum: Frustum;
  private _position: vec3;
  private _distance: number;
  private _target: vec3;
  private _up: vec3;
  private _hRotation: number = 0;
  private _vRotation: number = 0;

  private _canvas: HTMLCanvasElement;

  private _lastPoint: any;
  private _isPanning: boolean;
  private _suspended: boolean;
  private _fovy: number = 60;
  private _aspect: number = 1;
  private _near: number = 0.001;
  private _far: number = 1000000;
  private _minVRotation: number = (-Math.PI / 2) * 0.95;
  private _maxVRotation: number = (Math.PI / 2) * 0.95;

  constructor() {
    super();
    this._viewMatrix = mat4.create();
    this._worldMatrix = mat4.create();
    this._projectMatrix = mat4.create();
    this._projectViewMatrix = mat4.create();
    this._rotateMatrix = mat4.create();
    this._viewDirty = true;
    this._projectDirty = true;
    this._frustum = new Frustum();

    this._position = vec3.fromValues(0, 0, 1);
    this._distance = 10;
    this._target = vec3.create();
    this._up = vec3.fromValues(0, 1, 0);

    this._aspect = 1;

    this._lastPoint = {
      x: 0,
      y: 0,
    };
    this._isPanning = false;
    this._suspended = false;
  }

  public get near(): number {
    return this._near;
  }
  public get far(): number {
    return this._far;
  }
  public get aspect(): number {
    return this._aspect;
  }
  public get fovy(): number {
    return this._fovy;
  }

  public get projectViewMatrix(): mat4 {
    let mat = this._projectViewMatrix;
    if (this._projectDirty || this._viewDirty) {
      mat4.mul(mat, this._projectMatrix, this._viewMatrix);
      this._projectDirty = false;
      // this._frustum.fromMatrix(this);// todo 
    }
    return mat;
  }

  public get viewMatrix(): mat4 {
    let viewMatrix = this._viewMatrix,
      rotateMatrix = this._rotateMatrix,
      position = this._position;
    if (this._viewDirty) {
      mat4.identity(rotateMatrix);
      mat4.translate(rotateMatrix, rotateMatrix, this._target);
      mat4.rotateY(rotateMatrix, rotateMatrix, this._hRotation);
      mat4.rotateX(rotateMatrix, rotateMatrix, this._vRotation);
      vec3.set(tempVec, 0, 0, this._distance);
      vec3.transformMat4(position, tempVec, rotateMatrix);
      mat4.lookAt(viewMatrix, position, this._target, this._up);
      mat4.invert(this._worldMatrix, viewMatrix);
      this._viewDirty = false;
    }
    return viewMatrix;
  }

  public get worldMatrix(): mat4 {
    return this._worldMatrix;
  }

  public get position(): vec3 {
    return this._position;
  }
  public get target(): vec3 {
    return this._target;
  }
  public get up(): vec3 {
    return this._up;
  }

  public set viewMatrix(view: mat4) {
    let viewMatrix = this._viewMatrix,
      rotateMatrix = this._rotateMatrix,
      position = this._position;
    if (this._viewDirty) {
      mat4.identity(rotateMatrix);
      mat4.translate(rotateMatrix, rotateMatrix, this._target);
      mat4.rotateY(rotateMatrix, rotateMatrix, this._hRotation);
      mat4.rotateX(rotateMatrix, rotateMatrix, this._vRotation);
      vec3.set(tempVec, 0, 0, this._distance);
      vec3.transformMat4(position, tempVec, rotateMatrix);
      mat4.lookAt(viewMatrix, position, this._target, this._up);
      mat4.invert(this._worldMatrix, viewMatrix);
      this._viewDirty = false;
    }
  }

  public set projectMatrix(project: mat4) {
    let projectMatrix = this._projectMatrix;
    if (this._projectDirty) {
      mat4.perspective(
        projectMatrix,
        (this._fovy / 180) * Math.PI,
        this._aspect,
        this._near,
        this._far
      );
      this._projectDirty = false;
    }
  }

  public refresh() {
    this._refreshDistance();
  }

  _refreshDistance() {
    vec3.subtract(tempVec, this._position, this._target);
    const xz = Math.sqrt(tempVec[0] * tempVec[0] + tempVec[2] * tempVec[2]);
    this._hRotation = Math.atan2(tempVec[0], tempVec[2]);
    this._vRotation = -Math.atan2(tempVec[1], xz);
    this._distance = vec3.length(tempVec);
    this._viewDirty = true;
  }

  attach(canvas: HTMLCanvasElement) {
    if (this._canvas) {
      return;
    }
    this._canvas = canvas;
    this._aspect = canvas.width / canvas.height;

  /*   canvas.addEventListener('mousedown', this._handleMouseDown);
    canvas.addEventListener('touchstart', this._handleMouseDown, {
      passive: false,
    });
    canvas.addEventListener('wheel', this._handleWheel, { passive: false });
    canvas.addEventListener('blur', this._clean);
    canvas.addEventListener('keydown', this._handleKeydown);
    canvas.addEventListener('contextmenu', this._handleContextmenu); */
  }

  detach() {
    let canvas = this._canvas;
    if (!canvas) {
      return;
    }
    canvas.removeEventListener('mousedown', this._handleMouseDown);
    canvas.removeEventListener('touchstart', this._handleMouseDown);
    canvas.removeEventListener('wheel', this._handleWheel);
    canvas.removeEventListener('blur', this._clean);
    canvas.removeEventListener('keydown', this._handleKeydown);
    canvas.removeEventListener('contextmenu', this._handleContextmenu);
  }

  /**
   *
   * @param e
   * @returns
   */
  private _handleMouseDown(e: any) {
    e.preventDefault();
    if (e.button !== 0 && e.button !== 2) {
      return;
    }
    this._isPanning = e.button === 2;
    if (this._suspended) {
      return;
    }
    this._canvas.focus();
    this._lastPoint = getClientPoint(e);
    window.addEventListener('mousemove', this._handleMouseMove);
    window.addEventListener('mouseup', this._clean);
    window.addEventListener('touchmove', this._handleMouseMove);
    window.addEventListener('touchend', this._clean);
  }

  private _handleMouseMove(e: any) {
    if (this._suspended) {
      return;
    }
    let point = getClientPoint(e),
      offsetX = point.x - this._lastPoint.x,
      offsetY = point.y - this._lastPoint.y;
    if (this._isPanning) {
      this.pan(offsetX, offsetY);
    } else {
      let vRotation = this._vRotation,
        hRotation = this._hRotation,
        rotateSpeedY =
          (((360 / (canvas as HTMLCanvasElement).width) *
            window.devicePixelRatio) /
            180) *
          Math.PI,
        rotateSpeedX =
          (((180 / (canvas as HTMLCanvasElement).height) *
            window.devicePixelRatio) /
            180) *
          Math.PI;
      vRotation += -offsetY * rotateSpeedX;
      hRotation += -offsetX * rotateSpeedY;
      this._vRotation = vRotation;
      this._hRotation = hRotation;
    }
    this._lastPoint = point;
  }

  private _clean() {
    this._lastPoint = null;
    window.removeEventListener('mousemove', this._handleMouseMove);
    window.removeEventListener('mouseup', this._clean);
    window.removeEventListener('touchmove', this._handleMouseMove);
    window.removeEventListener('touchend', this._clean);
  }

  private _handleWheel(e: any) {
    e.preventDefault();
    if (this._suspended) {
      return;
    }
    let newDistance = this._distance;
    if (e.deltaY > 0) {
      newDistance *= 1.1;
    } else if (e.deltaY < 0) {
      newDistance /= 1.1;
    }
    this._distance = newDistance;
  }

  private _handleKeydown(e: any) {
    if (this._suspended) {
      return;
    }
    // TODO: handle both left and up down
    let { keyCode } = e,
      left = keyCode === 65 /* A */ || keyCode === 37 /* Left */,
      right = keyCode === 68 /* D */ || keyCode === 39 /* Right */,
      up = keyCode === 87 /* W */ || keyCode === 38 /* Up */,
      down = keyCode === 83 /* S */ || keyCode === 40 /* Down */,
      offsetX = 0,
      offsetY = 0,
      speed = 5;
    if (!left && !right && !up && !down) {
      return;
    }
    if (left) {
      offsetX += speed;
    }
    if (right) {
      offsetX -= speed;
    }
    if (up) {
      offsetY += speed;
    }
    if (down) {
      offsetY -= speed;
    }
    this.pan(offsetX, offsetY);
  }

  private _handleContextmenu(e: any) {
    e.preventDefault();
  }

  private pan(offsetX: number, offsetY: number) {
    let position = this._position,
      target = this._target,
      viewMatrix = this._viewMatrix,
      scale = this._distance / this._canvas.clientHeight;
    vec3.set(tempVec, viewMatrix[0], viewMatrix[4], viewMatrix[8]);
    vec3.scale(tempVec, tempVec, -offsetX * scale);
    vec3.add(position, position, tempVec);
    vec3.add(target, target, tempVec);

    vec3.set(tempVec, viewMatrix[1], viewMatrix[5], viewMatrix[9]);
    vec3.scale(tempVec, tempVec, offsetY * scale);
    vec3.add(position, position, tempVec);
    vec3.add(target, target, tempVec);

    this._position = position;
    this._target = target;
  }

  public set vRotation(v: number) {
    if (v > this._maxVRotation) {
      v = this._maxVRotation;
    }
    if (v < this._minVRotation) {
      v = this._minVRotation;
    }
    this._vRotation = v;
    this._viewDirty = true;
  }

  public set hRotation(h: number) {
    h %= Math.PI * 2;
    this._hRotation = h;
    this._viewDirty = true;
  }
}
