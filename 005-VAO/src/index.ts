import Data from './model/Data';
import Model from './model/Model';
import { Render } from './Render';

const render = new Render('canvas');

const model: Model = render.model;

for (let i = 0; i < 10; i++) {
  const data = new Data();
  data.type = 'Cube';
  model.add(data);
}

console.log(render);
console.log(model);
