'use strict';

var test = require('tap').test;
var BaseTask = require('../lib/base-task.js');

var react = require('../react');

/**
  @example
  var react = require('react');
  react.options.an_option = 'something';
  
  var loadAndSave = react.fstrDefine('one, two, cb -> err, result1, result2',
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
  loadAndSave.events.on('task.complete', function (taskObj) { });

  loadAndSave(1,2,cb);
 */

test('module exports an function object with properties', function (t) {
  t.type(react, 'function', 'is a core constructor function');
  t.type(react.options, 'object', 'has property for global react options');
  t.type(react.fstrDefine, 'function', 'has fn property for using fstr dsl');
  t.type(react.pcodeDefine, 'function', 'has fn property for using pcode dsl');
  t.type(react.chainDefine, 'function', 'has fn property for chain define');
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

test('deprecated react API should throw to help debugging', function (t) {
  function badUse() { 
    var r = react('filename, uid, outDirname, cb'); //this should throw
  }
  t.throws(badUse, new Error('react() takes no args, check API'));
  t.end();
});

test('setAndValidateAST sets the ast and validates returning errors', function (t) {
  var r = react();
  var errors = r.setAndValidateAST({
    inParams: ['a', 'b'],
    tasks: [
      { f: foo, a: ['a'], out: ['c'] },
      { f: bar, a: ['b'], out: ['d'] }
    ],
    outTask: { a: ['c', 'd'] }
  });
  t.deepEqual(r.ast.inParams, ['a', 'b'],      'ast.inParams() should match array just set');
  t.deepEqual(r.ast.tasks, [
    { f: foo, a: ['a'], out: ['c'], type: 'cb', name: 'foo' },
    { f: bar, a: ['b'], out: ['d'], type: 'cb', name: 'bar' }
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'], type: 'finalcb' },      'should return obj just set'); 
  t.end();
});


test('use pcodeDefine from module', function (t) {
  t.plan(3);
  function multiply(a, b, cb) { cb(null, a * b); }
  function add(a, b, cb) { cb(null, a + b); }
  var locals = { multiply: multiply, add: add };
  var fn = react.pcodeDefine('a, b, cb', [
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

test('use pcodeDefine with events', function (t) {
  t.plan(8);
  function multiply(a, b, cb) { cb(null, a * b); }
  function add(a, b, cb) { cb(null, a + b); }

  var events = [];
  function accumEvents(task) {
    events.push(task);
  }
  
  var locals = { multiply: multiply, add: add };
  var fn = react.pcodeDefine('a, b, cb', [
    'm := multiply(a, b)',
    's := add(m, a)',
    'cb(err, m, s)'
  ], locals);

  fn.events.on('task.complete', accumEvents);
  
  fn(2, 3, function (err, m, s) {
    t.deepEqual(err, null, 'should not be any error');
    t.equal(m, 6);
    t.equal(s, 8);
    t.equal(events.length, 2, 'should have seen two task compl events');
    t.equal(events[0].name, 'multiply', 'name matches');
    t.deepEqual(events[0].results, [6], 'results match');
    t.equal(events[1].name, 'add', 'name matches');
    t.deepEqual(events[1].results, [8], 'results match');
    t.end();
  });
});

test('use pcodeDefine.selectFirst with events', function (t) {
  t.plan(7);
  function noSuccess(a, b, cb) {
    setTimeout(function () { cb(null); }, 100); // returns undefined result
  }
  function noSuccessNull(a, b, cb) { cb(null, null); } // returns null result
  function add(a, b, cb) { cb(null, a + b); }

  var events = [];
  function accumEvents(task) {
    events.push(task);
  }
  
  var locals = { noSuccess: noSuccess, noSuccessNull: noSuccessNull, add: add };
  var fn = react.pcodeDefine.selectFirst('a, b, cb', [
    'c := noSuccess(a, b)',
    'c := noSuccessNull(a, b)',
    'c := add(a, b)',
    'c := noSuccess(a, b)',    
    'cb(err, c)'
  ], locals);

  fn.events.on('task.complete', accumEvents);
  
  fn(2, 3, function (err, c) {
    t.deepEqual(err, null, 'should not be any error');
    t.equal(c, 5);
    t.equal(events.length, 3, 'should have seen two task compl events');
    t.equal(events[0].name, 'noSuccess', 'name matches');
    t.equal(events[1].name, 'noSuccessNull', 'name matches');
    t.equal(events[2].name, 'add', 'name matches');
    t.deepEqual(events[2].results, [5], 'results match');
    t.end();
  });
});

test('use pcodeDefine events emit to global emitter', function (t) {
  t.plan(8);
  function multiply(a, b, cb) { cb(null, a * b); }
  function add(a, b, cb) { cb(null, a + b); }

  var events = [];
  function accumEvents(task) {
    events.push(task);
  }
  
  var locals = { multiply: multiply, add: add };
  var fn = react.pcodeDefine('a, b, cb', [
    'm := multiply(a, b)',
    's := add(m, a)',
    'cb(err, m, s)'
  ], locals);

  react.events.on('task.complete', accumEvents);  // the global react emitter
  
  fn(2, 3, function (err, m, s) {
    t.deepEqual(err, null, 'should not be any error');
    t.equal(m, 6);
    t.equal(s, 8);
    t.equal(events.length, 2, 'should have seen two task compl events');
    t.equal(events[0].name, 'multiply', 'name matches');
    t.deepEqual(events[0].results, [6], 'results match');
    t.equal(events[1].name, 'add', 'name matches');
    t.deepEqual(events[1].results, [8], 'results match');
    t.end();
  });
});



test('chainDefine use', function (t) {
  t.plan(8);
  function multiply(a, b, cb) { cb(null, a * b); }
  function add(a, b, cb) { cb(null, a + b); }

  var events = [];
  function accumEvents(task) {
    events.push(task);
  }
  
  var fn = react.chainDefine()
    .in('a', 'b', 'cb')
    .out('err', 'm', 's')
    .async(multiply).in('a', 'b', 'cb').out('err', 'm')
    .async(add).in('m', 'a', 'cb').out('err', 's')
    .end();

  fn.events.on('task.complete', accumEvents);
  
  fn(2, 3, function (err, m, s) {
    t.deepEqual(err, null, 'should not be any error');
    t.equal(m, 6);
    t.equal(s, 8);
    t.equal(events.length, 2, 'should have seen two task compl events');
    t.equal(events[0].name, 'multiply', 'name matches');
    t.deepEqual(events[0].results, [6], 'results match');
    t.equal(events[1].name, 'add', 'name matches');
    t.deepEqual(events[1].results, [8], 'results match');
    t.end();
  });
});

test('use chainDefine selectFirst with events', function (t) {
  t.plan(7);
  function noSuccess(a, b, cb) {
    setTimeout(function () { cb(null); }, 100); // returns undefined result
  }
  function noSuccessNull(a, b, cb) { cb(null, null); } // returns null result
  function add(a, b, cb) { cb(null, a + b); }

  var events = [];
  function accumEvents(task) {
    events.push(task);
  }

  var fn = react.chainDefine()
    .selectFirst()
    .in('a', 'b', 'cb')
    .out('err', 'c')
    .async(noSuccess).in('a', 'b', 'cb').out('err', 'c')
    .async(noSuccessNull).in('a', 'b', 'cb').out('err', 'c')
    .async(add).in('a', 'b', 'cb').out('err', 'c')
    .async(noSuccess).in('a', 'b', 'cb').out('err', 'c')
    .end();
  
  fn.events.on('task.complete', accumEvents);
  
  fn(2, 3, function (err, c) {
    t.deepEqual(err, null, 'should not be any error');
    t.equal(c, 5);
    t.equal(events.length, 3, 'should have seen two task compl events');
    t.equal(events[0].name, 'noSuccess', 'name matches');
    t.equal(events[1].name, 'noSuccessNull', 'name matches');
    t.equal(events[2].name, 'add', 'name matches');
    t.deepEqual(events[2].results, [5], 'results match');
    t.end();
  });
});

