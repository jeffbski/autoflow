'use strict';

/**
   Test core WhenTasks using promised-io
  */

var test = require('tap').test;
//var when = require('promised-io/promise');
var Deferred = require('promised-io/promise').Deferred;

var react = require('../');  //require('react');


function multiply(x, y) {
  var deferred = new Deferred();
  setTimeout(function () {
    deferred.resolve(x * y);
  }, 10);
  return deferred.promise;
}
function add(x, y) {
  var deferred = new Deferred();
  setTimeout(function () {
    deferred.resolve(x + y);
  }, 10);
  return deferred.promise;
}

function badF2(a, b) {
  var deferred = new Deferred();
  setTimeout(function () {
    deferred.reject(new Error('my-error'));
  }, 10);
  return deferred.promise;
}


test('multi-step', function (t) {
  t.plan(4);
  var fn = react();
  var errors = fn.setAndValidateAST({
    inParams: ['pm', 'pa'],
    tasks: [    
      { a: ['pm'], out: ['m'], type: 'when' },
      { a: ['pa'], out: ['a'], type: 'when' }
    ],
    outTask: { a: ['m', 'a'] }
  });
  t.deepEqual(errors, [], 'no validation errors');

  var pm = multiply(2, 3);
  var pa = add(4, 5);
  
  fn(pm, pa, function (err, m, a) {
    t.equal(err, null);
    t.equal(m, 6);
    t.equal(a, 9);
    t.end();
  });
});  


test('rejects with error', function (t) {
  t.plan(2);
  var fn = react();
  var errors = fn.setAndValidateAST({
    inParams: ['pm', 'pa'],
    tasks: [    
      { a: ['pm'], out: ['m'], type: 'when' },
      { a: ['pa'], out: ['a'], type: 'when' }
    ],
    outTask: { a: ['m', 'a'] }
  });
  t.deepEqual(errors, [], 'no validation errors');

  var pm = badF2(2, 3);
  var pa = add(4, 5);

  
  fn(pm, pa, function (err, m, a) {
    t.equal(err.message, 'my-error');
    t.end();
  });
});