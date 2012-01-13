'use strict';

/**
   Test core PromiseTasks using Deferred - jquery style promises
  */


var test = require('tap').test;
var Deferred = require('Deferred');
//var when = Deferred.when;


var react = require('../');  //require('react');

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
      { f: multiply, a: ['a', 'b'], out: ['c'], type: 'promise' },
      { f: add, a: ['c', 'b'], out: ['d'], type: 'promise' }
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

test('using "this" in a cb function', function (t) {
  t.plan(3);
  function getA(cb) {
    /*jshint validthis: true */
    var deferred = new Deferred();
    var self = this;
    setTimeout(function () {
      deferred.resolve(self.a);
    }, 10);
    return deferred.promise();
  }
  
  var fn = react();
  var errors = fn.setAndValidateAST({
    inParams: [],
    tasks: [    
      { f: getA, a: [], out: ['a'], type: 'promise' }
    ],
    outTask: { a: ['a'] }
  });
  t.deepEqual(errors, [], 'no validation errors');

  var obj = {
      a: 100
  };

  fn.apply(obj, [function (err, a) {
    t.equal(err, null);
    t.equal(a, 100);
    t.end();
  }]);
});


test('throws error', function (t) {
  t.plan(2);
  var fn = react();
  var errors = fn.setAndValidateAST({
    inParams: ['a', 'b'],
    tasks: [    
      { f: badFunc, a: ['a', 'b'], out: ['c'], type: 'promise' },
      { f: add, a: ['c', 'b'], out: ['d'], type: 'promise' }
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
      { f: badF2, a: ['a', 'b'], out: ['c'], type: 'promise' },
      { f: add, a: ['c', 'b'], out: ['d'], type: 'promise' }
    ],
    outTask: { a: ['c', 'd'] }
  });
  t.deepEqual(errors, [], 'no validation errors');

  fn(2, 3, function (err, c, d) {
    t.equal(err.message, 'my-error');
    t.end();
  });
});