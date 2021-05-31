import Model from './model/Model';
import Data from './model/Data';
import { Scene } from './Scene';

const scene = new Scene('canvas');

const model:Model =  scene.model;

for (let i = 0; i < 10; i++) {
  const data = new Data();
  data.type = 'Cube';
  model.add(data);
}

console.log(scene);
console.log(model);
