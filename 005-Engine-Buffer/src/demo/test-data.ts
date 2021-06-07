import { Data } from '../index';

let data = new Data();
data.on('change', (e) => {
  console.log(e);
});
data.type = 'Cube';
data.type = 'Sphere';

console.log(data);
