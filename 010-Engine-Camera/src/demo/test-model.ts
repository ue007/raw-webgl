import { Data, Model } from '../index';

let model = new Model();
console.log(model);
model.debug = true;
model.on(
  'change',
  (e) => {
    console.log(e);
  },
  model
);

/**
 * test  add
 */
for (let i = 0; i < 10; i++) {
  let data = new Data();
  model.add(data);
}
console.log(model);

// test get
console.log(model.get(2));

// test getById
console.log(model.getById(3));

// test forEach
model.forEach((data: Data) => {
  console.log(
    '--------------------------------model forEach--------------------------------'
  );
  console.log(data);
});

// test contains
let d = new Data();
console.log(model.contains(d));

// test remove
model.remove(model.get(1));
console.log(model);

// test clear
model.clear();
console.log(model);
