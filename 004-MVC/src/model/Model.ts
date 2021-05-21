import Data from './Data';
import Trigger from '../Trigger';
import { defineProperties } from '../util';

export default class Model extends Trigger<Model> {
  private _datas: Array<Data>;
  private _datasMap: Object;

  public constructor() {
    super();
    this._datas = [];
    this._datasMap = {};
  }

  public add(data: Data) {
    let self = this,
      datas = self._datas,
      datasMap = self._datasMap;
    if (self.contains(data)) {
      return self;
    }
    datas.push(data);
    datasMap[data.id] = data;
    data.on('all', self._handleDataChange, self);
    this.firePropertyChanged('add', data, data);
    if (data.children && data.children.length) {
      data.children.forEach((child) => {
        self.add(child);
      });
    }
    return self;
  }

  public remove(data) {
    let self = this,
      datas = self._datas,
      index = datas.indexOf(data);
    if (index >= 0) {
      let { children } = data;
      datas.splice(index, 1);
      delete self._datasMap[data.id];
      data.off('all', self._handleDataChange, self);
      this.firePropertyChanged('remove', data, data);
      data.parent = null;
      if (children && children.length) {
        for (let i = children.length - 1; i >= 0; i--) {
          self.remove(children[i]);
        }
      }
    }
    return self;
  }

  private _handleDataChange(e) {
    this.fire(e);
  }

  public contains(data) {
    return !!this._datasMap[data.id];
  }

  public forEach(callback, thisArg?) {
    let self = this;
    self._datas.forEach(callback, thisArg);
    return self;
  }

  public clear() {
    let self = this,
      datas = self._datas;
    self._datas = [];
    self._datasMap = {};
    this.firePropertyChanged('clear', null, null);
    return self;
  }

  public get(index): Data {
    return this._datas[index];
  }

  public getById(id): Data {
    return this._datasMap[id];
  }
}
