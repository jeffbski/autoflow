'use strict';

var test = require('tap').test;
var Deferred = require('Deferred');
//var when = Deferred.when;


var react = require('../');  //require('react');

/**
   Test core PromiseTasks using Deferred - jquery style promises
  */

function multiply(x, y) {
  var deferred = new Deferred();
  setTimeout(function () {
    deferred.resolve(x * y);
  }, 10);
  return deferred.promise();
}
function add(x, y) {
  var deferred = new Deferred();
  setTimeout(function () {
    deferred.resolve(x + y);
  }, 10);
  return deferred.promise();
}

function badFunc(a, b) {
  throw new Error('badFuncThrow');
}

function badF2(a, b) {
  var deferred = new Deferred();
  setTimeout(function () {
    deferred.reject(new Error('my-error'));
  }, 10);
  return deferred.promise();
}


test('multi-step', function (t) {
  t.plan(4);
  var fn = react();
  var errors = fn.setAndValidateAST({
    inParams: ['a', 'b'],
    tasks: [    
      { f: multiply, a: ['a', 'b'], out: ['c'], type:'promise' },
      { f: add, a: ['c', 'b'], out: ['d'], type:'promise' }
    ],
    outTask: { a: ['c', 'd'] }
  });
  t.deepEqual(errors, [], 'no validation errors');

  fn(2, 3, function (err, c, d) {
    t.equal(err, null);
    t.equal(c, 6);
    t.equal(d, 9);
    t.end();
  });
});  

test('throws error', function (t) {
  t.plan(2);
  var fn = react();
  var errors = fn.setAndValidateAST({
    inParams: ['a', 'b'],
    tasks: [    
      { f: badFunc, a: ['a', 'b'], out: ['c'], type:'promise' },
      { f: add, a: ['c', 'b'], out: ['d'], type:'promise' }
    ],
    outTask: { a: ['c', 'd'] }
  });
  t.deepEqual(errors, [], 'no validation errors');

  fn(2, 3, function (err, c, d) {
    t.equal(err.message, 'badFuncThrow');
    t.end();
  });
});

test('rejects with error', function (t) {
  t.plan(2);
  var fn = react();
  var errors = fn.setAndValidateAST({
    inParams: ['a', 'b'],
    tasks: [    
      { f: badF2, a: ['a', 'b'], out: ['c'], type:'promise' },
      { f: add, a: ['c', 'b'], out: ['d'], type:'promise' }
    ],
    outTask: { a: ['c', 'd'] }
  });
  t.deepEqual(errors, [], 'no validation errors');

  fn(2, 3, function (err, c, d) {
    t.equal(err.message, 'my-error');
    t.end();
  });
});