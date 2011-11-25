'use strict';

var test = require('tap').test;

var react = require('../react');

function multiply(x, y, cb) { cb(null, x * y); }
function add(x, y, cb) { cb(null, x + y); }
function badFunc(a, b, cb) { throw new Error('badFuncThrow'); }
function badF2(a, b, cb) { cb('my-error'); }


test('set and validate AST', function (t) {
  var fn = react();
  t.ok(fn.setAndValidateAST({
    inParams: ['a', 'b'],
    tasks: [
      { f: multiply, a: ['a', 'b'], cb: ['c'] }
    ],
    outTask: { a: ['c'] }
  }), 'should set and validate as true');
  t.deepEqual(fn.ast.inParams, ['a', 'b']);
  t.deepEqual(fn.ast.tasks, [
      { f: multiply, a: ['a', 'b'], cb: ['c'] }
    ]);
  t.deepEqual(fn.ast.outTask, { a: ['c'] }); 
  t.end();
});  

/*
test('execution with no errors should call callback with result', function (t) {
  t.plan(2);
  var fn = react();
  fn.ast.inParams = ['a', 'b'];
  fn.ast.tasks = [
    { f: multiply, a: ['a', 'b'], cb: ['c'] }
  ];
  fn.ast.outTask = { a: ['c'] };

  fn(2, 3, function (err, c) {
    t.equal(err, null);
    t.equal(c, 6);
    t.end();
  });
});

test('multi-step', function (t) {
  t.plan(3);
  var fn = react();
  fn.ast.inParams = ['a', 'b'];
  fn.ast.tasks = [    
    { f: multiply, a: ['a', 'b'], cb: ['c'] },
    { f: add, a: ['c', 'b'], cb: ['d'] }
  ];
  fn.ast.outTask = { a: ['c', 'd'] };

  fn(2, 3, function (err, c, d) {
    t.equal(err, null);
    t.equal(c, 6);
    t.equal(d, 9);
    t.end();
  });
});  
  
test('multi-step func throws, cb with error', function (t) {
  t.plan(1);
  var fn = react();
  fn.ast.inParams = ['a', 'b'];
  fn.ast.tasks = [    
    { f: multiply, a: ['a', 'b'], cb: ['c'] },
    { f: badFunc, a: ['c', 'b'], cb: ['d'] }
  ];
  fn.ast.outTask = { a: ['c', 'd'] };

  fn(2, 3, function (err, c, d) {
    t.equal(err.message, 'badFuncThrow');
    t.end();
  });
});  
  
test('multi-step func cb err, cb with error', function (t) {
  t.plan(1);
  var fn = react();
  fn.ast.inParams = ['a', 'b'];
  fn.ast.tasks = [    
    { f: multiply, a: ['a', 'b'], cb: ['c'] },
    { f: badF2, a: ['c', 'b'], cb: ['d'] },
    { f: add, a: ['d', 'b'], cb: ['e'] }
  ];
  fn.ast.outTask = { a: ['c', 'e'] };

  fn(2, 3, function (err, c, d) {
    t.equal(err.message, 'my-error');
    t.end();
  });
});  
  
*/