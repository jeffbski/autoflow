/*global react:true BaseTask:true */

if (typeof(chai) === 'undefined') {
  var chai = require('chai');
}

if (typeof(react) === 'undefined') {
  var react = require('../'); //require('react');
}

if (typeof(BaseTask) === 'undefined') {
  var BaseTask = require('../lib/base-task.js');
}

(function () {
  'use strict';

  var t = chai.assert;

  /**
     Testing the general use of react
  */

  suite('module-use');

  /**
     @example
     var react = require('react');
     react.options.an_option = 'something';

     // define function
     var loadAndSave = react('myName', 'one, two, cb -> err, result1, result2',
     foo, 'one, cb      -> err, cat',
     bar, 'two, cat, cb -> err, dog',
     baz, 'dog, cb      -> err, result1',
     bum, 'dog, cb      -> err, result2');

     // OR using AST

     var loadAndSave = react();
     loadAndSave.setAndValidateAST({
     inParams: ['one', 'two'],
     tasks: { },
     outTask: { a: ['three'] }
     });

     //if you want to listen to task completion events
     loadAndSave.events.on('task.complete', function (taskObj) { });

     loadAndSave(1,2,cb); // execute like any other function
  */

  test('module exports an function object with properties', function (done) {
    t.isFunction(react, 'is a core constructor and default dsl function');
    t.isObject(react.options, 'has property for global react options');
    t.isObject(react.events, 'has global react event manager');
    t.isFunction(react.logEvents, 'has function to enable event logging');
    t.isFunction(react.trackTasks, 'has function to enable task and flow tracking');
    t.isFunction(react.resolvePromises, 'has fn to enable promise detection & resolution');
    done();
  });

  function foo() { }
  function bar() { }

  test('calling react constructor function creates new function with ast', function (done) {
    var r = react();
    t.isFunction(r, 'is a function ready to execute flow');
    t.isObject(r.ast, 'is object for inspecting AST');
    t.deepEqual(r.ast.inParams, [],              'ast.inParams should return empty array');
    t.deepEqual(r.ast.tasks, [],                 'ast.tasks() should return empty array');
    t.deepEqual(r.ast.outTask, { a: [], type: 'finalcb' });
    done();
  });

  test('setAndValidateAST sets the ast and validates returning errors', function (done) {
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
    done();
  });

  test('use react() default DSL from module', function (done) {
    function multiply(a, b, cb) { cb(null, a * b); }
    function add(a, b, cb) { cb(null, a + b); }
    var fn = react('multiplyAdd', 'a, b, cb -> err, m, s',
                   multiply, 'a, b, cb -> err, m',
                   add, 'm, a, cb -> err, s'
                  );


    fn(2, 3, function (err, m, s) {
      t.deepEqual(err, null, 'should not be any error');
      t.equal(m, 6);
      t.equal(s, 8);
      done();
    });
  });

  test('use react.selectFirst() default DSL with events', function (done) {
    function noSuccess(a, b, cb) {
      setTimeout(function () { cb(null); }, 100); // returns undefined result
    }
    function noSuccessNull(a, b, cb) { cb(null, null); } // returns null result
    function add(a, b, cb) { cb(null, a + b); }


    var fn = react.selectFirst('mySelectFirst', 'a, b, cb -> err, c',
                               noSuccess, 'a, b, cb -> err, c',
                               noSuccessNull, 'a, b, cb -> err, c',
                               add, 'a, b, cb -> err, c',
                               noSuccess, 'a, b, cb -> err, c'
                              );

    var collector = react.createEventCollector();
    collector.capture(fn, 'task.complete');

    fn(2, 3, function (err, c) {
      t.deepEqual(err, null, 'should not be any error');
      t.equal(c, 5);
      var events = collector.list();
      t.equal(events.length, 3, 'should have seen two task compl events');
      t.equal(events[0].task.name, 'noSuccess', 'name matches');
      t.equal(events[1].task.name, 'noSuccessNull', 'name matches');
      t.equal(events[2].task.name, 'add', 'name matches');
      t.deepEqual(events[2].task.results, [5], 'results match');
      done();
    });
  });

  test('reference local/global vars', function (done) {
    function foo(cb) {
      cb(null, 100);
    }

    var fn = react('refGlobal', 'cb -> err, result',
      'console.log', '"using global/local ref to console" ->',
      foo, 'cb -> err, result', { after: 'console.log' }
    );

    fn(function (err, result) {
      if (err) return done(err);
      t.equal(result, 100);
      done();
    });
  });

}());




