import Renderer from './renderer';
import Model from './model';
import Data from './data';


const model = new Model();
const data = new Data();
model.add(data);
const renderer = new Renderer('canvas');
renderer.bind(model);
renderer.start();
