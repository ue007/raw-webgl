import { Data } from 'src/index';
import Trigger from '../base/Trigger';

export default class Model extends Trigger<Model> {
  private _datas: Array<Data>;
  private _datasMap: Map<number, Data>;
  private _debug: boolean;

  public constructor() {
    super();
    this._datas = [];
    this._datasMap = new Map();
    this._debug = false;
    this.source = this;
  }

  public get datas(): Array<Data> {
    return this._datas;
  }

  public get datasMap(): Map<number, Data> {
    return this._datasMap;
  }

  public set debug(d: boolean) {
    this._debug = d;
  }

  /**
   *
   * @param data
   * @returns Model
   */
  public add(data: Data): Model {
    let datas = this._datas,
      datasMap = this._datasMap;
    if (this.contains(data)) {
      return this;
    }
    let old: Array<Data> = [];
    Object.assign(old, datas);
    
    datas.push(data);
    datasMap.set(data.id, data);

    this.firePropertyChanged('datas', old, datas);

    if (data.children && data.children.length) {
      data.children.forEach((child) => {
        this.add(child);
      });
    }
    return this;
  }

  public remove(data: Data): Model {
    let datas = this._datas,
      index = datas.indexOf(data);
    if (index >= 0) {
      let { children } = data;
      datas.splice(index, 1);
      this._datasMap.delete(data.id);
      data.parent = null;
      if (children && children.length) {
        for (let i = children.length - 1; i >= 0; i--) {
          this.remove(children[i]);
        }
      }
    }
    return this;
  }

  /**
   * 派发数据变更事件
   * @param e
   */
  private _handleDataChange(e: any) {
    if (this._debug) {
      console.log(e);
    }
    this.fire(e);
  }

  /**
   * 判断是否包含子元素
   * @param data
   * @returns
   */
  public contains(data: Data): boolean {
    return !!this._datasMap.get(data.id);
  }

  /**
   * 遍历数据容器
   * @param callback
   * @param thisArg
   * @returns
   */
  public forEach(callback: any, thisArg?: any) {
    this._datas.forEach(callback, thisArg);
    return this;
  }

  /**
   * 清空数据容器
   * @returns
   */
  public clear() {
    let datas = this._datas;
    this._datas = [];
    this._datasMap.clear();
    this.firePropertyChanged('clear', null, null);
    return this;
  }

  /**
   * 根据index获取元素
   * @param index
   * @returns
   */
  public get(index: number): Data {
    return this._datas[index];
  }

  /**
   * 根据id获取元素
   * @param id
   * @returns
   */
  public getById(id: number): Data {
    return this._datasMap.get(id);
  }
}
