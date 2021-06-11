import { vec3, quat, mat3, mat4 } from 'gl-matrix';
import Trigger from '../base/Trigger';
import { createVertexArray, vaos } from '../gl/Geometries';
import VertexArray from '../gl/VertexArray';

let dataId = 0,
  rotationMatrix = mat4.create();

export default class Data extends Trigger<Data> {
  private _id: number;
  private _type: string;
  private _children: Array<Data>;
  private _parent: Data;

  private _vao: VertexArray;

  public constructor() {
    super();
    this._id = dataId++;
    this._children = [];
    this._parent = null;
  }

  /**
   * 获取id信息
   */
  public get id(): number {
    return this._id;
  }

  /**
   * 设置数据类型：Cube、Sphere and so on
   */
  public set type(t: string) {
    if (this._type === t) {
      return;
    }
    let old = this._type;
    this._type = t;
    this.firePropertyChanged('type', old, t);

    // dirty and create vao
    console.log('create vao');
    let vao = createVertexArray(t);

    if (vao) {
      this._vao = vao;
      /*  // TODO: Hack
      if (vao._color) {
        if (!this.material) {
          this.material = new STDMaterial();
        }
        this.material.vertexColor = true;
      } else if (this.material) {
        this.material.vertexColor = false;
      } */
    } else {
      this._vao = null;
    }
  }

  public get type(): string {
    return this._type;
  }

  public get children(): Array<Data> {
    return this._children;
  }

  /**
   * 获取父元素
   */
  public get parent(): Data {
    return this._parent;
  }

  /**
   * 设置父元素
   */
  public set parent(p: Data) {
    this._parent = p;
  }

  public set vao(vao: VertexArray) {
    this._vao = vao;
  }

  public get vao(): VertexArray {
    return this._vao;
  }
}
