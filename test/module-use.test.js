'use strict';

var test = require('tap').test;

var react = require('../react');

/**
  @example
  var react = require('react');
  react.options.an_option = 'something';
  
  var loadAndSave = react.dslfs('one, two, cb -> err, result1, result2',
    foo, 'one      -> err, cat',
    bar, 'two, cat -> err, dog',
    baz, 'dog      -> err, result1',
    bum, 'dog      -> err, result2');
  
  var loadAndSave = react();
  loadAndSave.setAndValidateAST({
    inParams: ['one', 'two'],
    tasks: { },
    outTask: { a: ['three'] }
  });

  loadAndSave(1,2,cb);
 */

test('module exports an function object with properties', function (t) {
  t.type(react, 'function', 'is a core constructor function');
  t.type(react.options, 'object', 'has property for global react options');
  t.type(react.dslfs, 'function', 'has fn property for using fs dsl');
  t.end();
});

function foo() { }
function bar() { }

test('calling react constructor function creates new function with ast', function (t) {
  var r = react();
  t.type(r, 'function', 'is a function ready to execute flow');
  t.type(r.ast, 'object', 'is object for inspecting AST');
  t.deepEqual(r.ast.inParams, [],              'ast.inParams should return empty array');
  t.deepEqual(r.ast.tasks, [],                 'ast.tasks() should return empty array');
  t.deepEqual(r.ast.outTask, {},                   'should return empty object');
  t.end();
});

test('setAndValidateAST sets the ast and validates returning errors', function (t) {
  var r = react();
  var errors = r.setAndValidateAST({
    inParams: ['a', 'b'],
    tasks: [
      { type: 'cb', f: foo, a: ['a'], cb: ['c'] },
      { type: 'cb', f: bar, a: ['b'], cb: ['d'] }
    ],
    outTask: { a: ['c', 'd'] }
  });
  t.deepEqual(r.ast.inParams, ['a', 'b'],      'ast.inParams() should match array just set');
  t.deepEqual(r.ast.tasks, [
    { type: 'cb', f: foo, a: ['a'], cb: ['c'], name: 'foo' },
    { type: 'cb', f: bar, a: ['b'], cb: ['d'], name: 'bar' }
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'] },      'should return obj just set'); 
  t.end();
});