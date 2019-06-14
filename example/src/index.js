console.log('Dynamically importing `./sum.js`...');

// Custom chunk names are supported!
import(/* webpackChunkName: "sum-module" */ './sum').then((module) => {
  console.log('`./sum.js` imported dynamically!');
  console.log('1 + 2 + 3 + 4 + 5 = ' + module.default(1, 2, 3, 4, 5));
});

console.log('Waiting for `./sum.js`...');
