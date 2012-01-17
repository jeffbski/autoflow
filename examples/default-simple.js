'use strict';

/**
   Simple example showing flow definition of two async functions feeding a
   synchronous function.

   First two async functions inputs are satisfied by the flow inputs, so
   they will both run immediately in parallel.

   The last function waits for the outputs of the previous ones, then
   executes synchronously.

   Finally the flow calls the callback with the output values once all
   the tasks have completed.
  */

var react = require('../'); // require('react');

function loadFoo(fooPath, cb) {
  setTimeout(function () {
    cb(null, [fooPath, 'data'].join(':'));
  }, 10);
}

function loadBar(barPath, barP2, cb) {
  setTimeout(function () {
    cb(null, [barPath, barP2, 'data'].join(':'));
  }, 10);
}

function render(foo, bar) {
  return ['<html>', foo, '/', bar, '</html>'].join('');
}


var fn = react('loadRender', 'fooPath, barPath, barP2, cb -> err, renderedOut',
  loadFoo, 'fooPath, cb -> err, foo',
  loadBar, 'barPath, barP2, cb -> err, bar',
  render, 'foo, bar -> renderedOut'
);


fn('foo.txt', 'bar.txt', 'BBB', function (err, renderedOut) {
  console.error('results:', renderedOut);
});