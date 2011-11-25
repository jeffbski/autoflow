'use strict';

var test = require('tap').test;

var react = require('../react');

/*
  react.options.an_option = 'something';
  
  var loadAndSave = react('one, two, cb -> err, result1, result2',
    foo, 'one      -> err, cat',
    bar, 'two, cat -> err, dog',
    baz, 'dog      -> err, result1',
    bum, 'dog      -> err, result2');
  
  var loadAndSave = react();
  loadAndSave.ast.inParams(['one', 'two'])
    .tasks({ })
    .outTask({ });

  loadAndSave(1,2,cb);
 */

test('module exports an function object with properties', function (t) {
  t.type(react, 'function', 'is a constructor function that by default uses DSL');
  t.type(react.options, 'object', 'has property for global react options');
  t.end();
});

test('calling react constructor function creates new function with ast', function (t) {
  var r = react();
  t.type(r, 'function', 'is a function ready to execute flow');
  t.type(r.ast, 'object', 'is object for getting or setting AST directly');
  t.deepEqual(r.ast.inParams, [],              'ast.inParams should return empty array');
  r.ast.inParams = ['a', 'b'];
  t.deepEqual(r.ast.inParams, ['a', 'b'],      'ast.inParams() should match array just set');
  t.deepEqual(r.ast.tasks, [],                 'ast.tasks() should return empty array');
  r.ast.tasks = [{ name: 'foo' }, { name: 'bar' }];
  t.deepEqual(r.ast.tasks, [{ name: 'foo' }, { name: 'bar' }], 'get should return arr just set');
  t.deepEqual(r.ast.outTask, {},                   'should return empty object');
  r.ast.outTask = { name: 'baz' };
  t.deepEqual(r.ast.outTask, { name: 'baz' },      'should return obj just set'); 
  t.end();
});