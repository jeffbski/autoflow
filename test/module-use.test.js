'use strict';

var test = require('tap').test;
var EventEmitter = require('events').EventEmitter;
var BaseTask = require('../lib/base-task.js');

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

  //if you want to listen to task completion events
  loadAndSave.events.on('taskComplete', function (name, args, taskObj) { });

  loadAndSave(1,2,cb);
 */

test('module exports an function object with properties', function (t) {
  t.type(react, 'function', 'is a core constructor function');
  t.type(react.options, 'object', 'has property for global react options');
  t.type(react.dslfs, 'function', 'has fn property for using fs dsl');
  t.type(react.dslp, 'function', 'has fn property for using p dsl');
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
      { f: foo, a: ['a'], cb: ['c'] },
      { f: bar, a: ['b'], cb: ['d'] }
    ],
    outTask: { a: ['c', 'd'] }
  });
  t.deepEqual(r.ast.inParams, ['a', 'b'],      'ast.inParams() should match array just set');
  t.deepEqual(r.ast.tasks, [
    { f: foo, a: ['a'], cb: ['c'], type: 'cb', name: 'foo' },
    { f: bar, a: ['b'], cb: ['d'], type: 'cb', name: 'bar' }
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'] },      'should return obj just set'); 
  t.end();
});


test('use dslp from module', function (t) {
  t.plan(3);
  function multiply(a, b, cb) { cb(null, a * b); }
  function add(a, b, cb) { cb(null, a + b); }
  var locals = { multiply: multiply, add: add };
  var fn = react.dslp('a, b, cb', [
    'm := multiply(a, b)',
    's := add(m, a)',
    'cb(err, m, s)'
  ], locals);
  
  fn(2, 3, function (err, m, s) {
    t.deepEqual(err, null, 'should not be any error');
    t.equal(m, 6);
    t.equal(s, 8);
    t.end();
  });
});

test('use dslp with events', function (t) {
  t.plan(10);
  function multiply(a, b, cb) { cb(null, a * b); }
  function add(a, b, cb) { cb(null, a + b); }

  var events = []
  function accumEvents(name, results, task) {
    events.push( { name: name, results: results, task: task } );
  }
  
  var locals = { multiply: multiply, add: add };
  var fn = react.dslp('a, b, cb', [
    'm := multiply(a, b)',
    's := add(m, a)',
    'cb(err, m, s)'
  ], locals);

  fn.events.on('taskComplete', accumEvents);
  
  fn(2, 3, function (err, m, s) {
    t.deepEqual(err, null, 'should not be any error');
    t.equal(m, 6);
    t.equal(s, 8);
    t.equal(events.length, 2, 'should have seen two task compl events');
    t.equal(events[0].name, 'multiply', 'name matches');
    t.deepEqual(events[0].results, [6], 'results match');
    t.type(events[0].task, BaseTask, 'instanceof BaseTask');
    t.equal(events[1].name, 'add', 'name matches');
    t.deepEqual(events[1].results, [8], 'results match');
    t.type(events[1].task, BaseTask, 'instanceof BaseTask');
    t.end();
  });
});