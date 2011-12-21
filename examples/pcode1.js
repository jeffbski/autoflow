'use strict';

var react = require('../'); // require('react');

function multiply(a, b, cb) { cb(null, a * b); }
function add(a, b) { return a + b; }
var locals = {   // since pcodeDefine uses strings, need references to functions passed into react
  multiply: multiply,
  add: add
};

var fn = react.pcodeDefine('a, b, cb', [  // input params
  'm := multiply(a, b)',   // using a callback function, use :=
  's = add(m, a)',        // using a sync function, use =
  'cb(err, m, s)'     // output params for final callback
], locals);    // hash of functions that will be used

fn(2, 3, function (err, m, s) {
  console.error('err:', err); // null
  console.error('m:', m);  // 2 * 3 = 6
  console.error('s:', s);  // 6 + 2 = 8
});
