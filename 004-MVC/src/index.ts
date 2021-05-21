import Model from './model/Model';
import Data from './model/Data';
import { Scene } from './Scene';

const model = new Model();

for (let i = 0; i < 10; i++) {
  const data = new Data();
  data.type = 'Cube';
  model.add(data);
}

console.log(model);

const scene = new Scene('canvas');
scene.bind(model);

// // draw element
// const element = new Data({
//   vertices: [-0.5, 0.5, 0.0, -0.5, -0.5, 0.0, 0.5, -0.5, 0.0, 0.5, 0.5, 0.0],
//   colors: [
//     1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 0.0, 1.0,
//     1.0,
//   ],
//   indices: [0, 1, 2, 3, 1, 0],
// });
// model.add(element);

// renderer.bindGUI();
// renderer.start();
