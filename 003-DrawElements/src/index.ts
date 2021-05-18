import Renderer from './renderer';
import Model from './model';
import Data from './data';

const model = new Model();

// draw arrays
const data = new Data();
model.add(data);

// draw element
const element = new Data({
  vertices: [-0.5, 0.5, 0.0, -0.5, -0.5, 0.0, 0.5, -0.5, 0.0, 0.5, 0.5, 0.0],
  colors: [
    1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 0.0, 1.0,
    1.0,
  ],
  indices: [0, 1, 2, 3, 1, 0],
});
model.add(element);

const renderer = new Renderer('canvas');
renderer.bind(model);
renderer.bindGUI();
renderer.start();
