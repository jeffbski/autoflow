/*global react:true */

if (typeof(chai) === 'undefined') {
  var chai = require('chai');
}

if (typeof(react) === 'undefined') {
  var react = require('../'); //require('react');
}

(function () {
  'use strict';

  var t = chai.assert;

  /**
     Testing core functionality
  */

  suite('core');

  function multiply(x, y, cb) { cb(null, x * y); }
  function add(x, y, cb) { cb(null, x + y); }
  function badFunc(a, b, cb) { throw new Error('badFuncThrow'); }
  function badF2(a, b, cb) { cb('my-error'); }
  function fnRetsSum(a, b) { return a + b; }
  var anonFn = function (a, b) { return a + b; };

  test('set and validate AST', function (done) {
    var fn = react();
    var errors = fn.setAndValidateAST({
      name: 'myflow',
      inParams: ['a', 'b'],
      tasks: [
        { f: multiply, a: ['a', 'b'], out: ['c'] }
      ],
      outTask: { a: ['c'] },
      otherOpt: 'foo',
      otherOpt2: 'bar'
    });
    t.deepEqual(errors, [], 'should set and validate as true');
    t.deepEqual(fn.ast.inParams, ['a', 'b']);
    t.deepEqual(fn.ast.tasks, [
      { f: multiply, a: ['a', 'b'], out: ['c'], type: 'cb', name: 'multiply' }
    ]);
    t.deepEqual(fn.ast.outTask, { a: ['c'], type: 'finalcb' });
    t.equal(fn.ast.name, 'myflow', 'name should match if set');
    t.equal(fn.ast.otherOpt, 'foo', 'any additional options should pass through');
    done();
  });

  test('unnamed tasks will be assigned unique names', function (done) {
    var fn = react();
    var errors = fn.setAndValidateAST({
      inParams: ['a', 'b'],
      tasks: [
        { f: multiply, a: ['a', 'b'], out: ['c'] },
        { f: multiply, a: ['a', 'b'], out: ['d'], name: 'multiply' },
        { f: multiply, a: ['a', 'b'], out: ['e'], name: 'times' },
        { f: anonFn,   a: ['a', 'b'], out: ['g'], type: 'ret' },
        { f: multiply, a: ['a', 'b'], out: ['f'] }
      ],
      outTask: { a: ['c'] }
    });
    t.deepEqual(errors, [], 'should set and validate as true');
    t.equal(fn.ast.name.slice(0, 'flow_'.length), 'flow_', 'generated flow name should start with flow_');
    t.deepEqual(fn.ast.tasks, [
      { f: multiply, a: ['a', 'b'], out: ['c'], type: 'cb', name: 'multiply_0' },
      { f: multiply, a: ['a', 'b'], out: ['d'], name: 'multiply', type: 'cb' },
      { f: multiply, a: ['a', 'b'], out: ['e'], name: 'times', type: 'cb' },
      { f: anonFn,   a: ['a', 'b'], out: ['g'], type: 'ret', name: 'task_3' },
      { f: multiply, a: ['a', 'b'], out: ['f'], type: 'cb', name: 'multiply_4' }
    ]);
    done();
  });


  test('execution with no errors should call callback with result', function (done) {
    var fn = react();
    var errors = fn.setAndValidateAST({
      inParams: ['a', 'b'],
      tasks: [
        { f: multiply, a: ['a', 'b'], out: ['c'] }
      ],
      outTask: { a: ['c'] }
    });
    t.deepEqual(errors, [], 'no validation errors');
    fn(2, 3, function (err, c) {
      t.equal(err, null);
      t.equal(c, 6);
      done();
    });
  });

  test('multi-step', function (done) {
    var fn = react();
    var errors = fn.setAndValidateAST({
      inParams: ['a', 'b'],
      tasks: [
        { f: multiply, a: ['a', 'b'], out: ['c'] },
        { f: add, a: ['c', 'b'], out: ['d'] }
      ],
      outTask: { a: ['c', 'd'] }
    });
    t.deepEqual(errors, [], 'no validation errors');

    fn(2, 3, function (err, c, d) {
      t.equal(err, null);
      t.equal(c, 6);
      t.equal(d, 9);
      done();
    });
  });

  test('multi-step with after as nonarr fn', function (done) {
    var fn = react();
    var errors = fn.setAndValidateAST({
      inParams: ['a', 'b'],
      tasks: [
        { f: multiply, a: ['a', 'b'], out: ['c'], after: add },
        { f: add, a: ['a', 'b'], out: ['d'] }
      ],
      outTask: { a: ['c', 'd'] }
    });
    t.deepEqual(errors, [], 'no validation errors');

    var collector = react.createEventCollector();
    collector.capture(fn, 'task.complete');

    fn(2, 3, function (err, c, d) {
      t.equal(err, null);
      t.equal(c, 6);
      t.equal(d, 5);
      var events = collector.list();
      t.equal(events.length, 2, 'should have seen one task compl events');
      t.equal(events[0].task.name, 'add', 'name matches');
      t.equal(events[1].task.name, 'multiply', 'name matches');
      done();
    });
  });

  test('mixed multi-step with after as nonarr fn w/events', function (done) {
    var fn = react();
    var errors = fn.setAndValidateAST({
      inParams: ['a', 'b'],
      tasks: [
        { f: multiply, a: ['a', 'b'], out: ['c'], after: fnRetsSum },
        { f: fnRetsSum, a: ['a', 'b'], out: ['d'], type: 'ret' }
      ],
      outTask: { a: ['c', 'd'] }
    });
    t.deepEqual(errors, [], 'no validation errors');

    var collector = react.createEventCollector();
    collector.capture(fn, 'task.complete');

    fn(2, 3, function (err, c, d) {
      t.equal(err, null);
      t.equal(c, 6);
      t.equal(d, 5);
      var events = collector.list();
      t.equal(events.length, 2, 'should have seen one task compl events');
      t.equal(events[0].task.name, 'fnRetsSum', 'name matches');
      t.isNotNull(events[0].task.id, 'has unique id');
      t.isNotNull(events[0].task.startTime, 'has startTime');
      t.isNotNull(events[0].task.endTime, 'has endTime');
      t.isNotNull(events[0].task.elapsedTime !== undefined, 'has elapsedTime');
      t.isNotNull(events[0].task.args, 'has args');
      t.isNotNull(events[0].task.results, 'has results');
      t.equal(events[1].task.name, 'multiply', 'name matches');
      t.isNotNull(events[1].task.id, 'has unique id');
      t.isNotNull(events[1].task.startTime, 'has startTime');
      t.isNotNull(events[1].task.endTime, 'has endTime');
      t.isNotNull(events[1].task.elapsedTime !== undefined, 'has elapsedTime');
      t.isNotNull(events[1].task.args, 'has args');
      t.isNotNull(events[1].task.results, 'has results');
      done();
    });
  });




  test('sets obj values', function (done) {
    var fn = react();
    var errors = fn.setAndValidateAST({
      inParams: ['a', 'b', 'c'],
      tasks: [
        { f: multiply, a: ['a', 'b'], out: ['c.mult'] },
        { f: fnRetsSum, a: ['c.mult', 'b'], out: ['c.sum'], type: 'ret' }
      ],
      outTask: { a: ['c.mult', 'c.sum', 'c'] }
    });
    t.deepEqual(errors, [], 'no validation errors');

    fn(2, 3, { foo: 1 }, function (err, cmult, csum, c) {
      t.deepEqual(err, null, 'should be no err');
      t.equal(cmult, 6);
      t.equal(csum, 9);
      t.deepEqual(c, { foo: 1, mult: 6, sum: 9});
      done();
    });
  });

  test('error when cant complete', function (done) {
    var fn = react();
    var errors = fn.setAndValidateAST({
      inParams: ['a', 'b', 'c'],
      tasks: [
        { f: multiply, a: ['a', 'b'], out: ['c.mult'] },
        { f: fnRetsSum, a: ['c.bad', 'b'], out: ['c.sum'], type: 'ret' },
        { f: add, a: ['c.sum', 'a'], out: ['d']}
      ],
      outTask: { a: ['c.mult', 'c.sum', 'd'] }
    });
    t.deepEqual(errors, [], 'no validation errors');

    fn(2, 3, { foo: 1 }, function (err, cmult, csum, d) {
      t.equal(err.message, 'no tasks running, flow will not complete, remaining tasks: fnRetsSum, add');
      done();
    });
  });


  test('objects', function (done) {
    function retObj(a, b, cb) { cb(null, { bar: a + b }); }
    function concat(a, b, cb) { cb(null, { result: a + b }); }

    var fn = react();
    var errors = fn.setAndValidateAST({
      inParams: ['a', 'b'],
      tasks: [
        { f: retObj, a: ['a.foo', 'b'], out: ['c'] },
        { f: concat, a: ['c.bar', 'b'], out: ['d'] }
      ],
      outTask: { a: ['c', 'd.result'] }
    });
    t.deepEqual(errors, [], 'no validation errors');

    fn({ foo: 'FOO' }, 'B', function (err, c, dresult) {
      t.equal(err, null);
      t.deepEqual(c, { bar: 'FOOB' });
      t.equal(dresult, 'FOOBB');
      done();
    });
  });

  test('objects from container', function (done) {
    var C = {
      retObj: function retObj(a, b, cb) { cb(null, { bar: a + b }); },
      concat: function concat(a, b, cb) { cb(null, { result: a + b }); }
    };

    var fn = react();
    var errors = fn.setAndValidateAST({
      inParams: ['a', 'b'],
      tasks: [
        { f: C.retObj, a: ['a.foo', 'b'], out: ['c'] },
        { f: C.concat, a: ['c.bar', 'b'], out: ['d'] }
      ],
      outTask: { a: ['c', 'd.result'] }
    });
    t.deepEqual(errors, [], 'no validation errors');

    fn({ foo: 'FOO' }, 'B', function (err, c, dresult) {
      t.equal(err, null);
      t.deepEqual(c, { bar: 'FOOB' });
      t.equal(dresult, 'FOOBB');
      done();
    });
  });

  test('objects from container input arg', function (done) {
    var CONT = {
      retObj: function retObj(a, b, cb) { cb(null, { bar: a + b }); },
      concat: function concat(a, b, cb) { cb(null, { result: a + b }); }
    };

    var fn = react();
    var errors = fn.setAndValidateAST({
      inParams: ['a', 'b', 'CONT'],
      tasks: [
        { f: 'CONT.retObj', a: ['a.foo', 'b'], out: ['c'] },
        { f: 'CONT.concat', a: ['c.bar', 'b'], out: ['d'] }
      ],
      outTask: { a: ['c', 'd.result'] }
    });
    t.deepEqual(errors, [], 'no validation errors');

    fn({ foo: 'FOO' }, 'B', CONT, function (err, c, dresult) {
      t.equal(err, null);
      t.deepEqual(c, { bar: 'FOOB' });
      t.equal(dresult, 'FOOBB');
      done();
    });
  });

  test('use locals for functions', function (done) {
    var locals = {
      retObj: function retObj(a, b, cb) { cb(null, { bar: a + b }); },
      concat: function concat(a, b, cb) { cb(null, { result: a + b }); }
    };

    var fn = react();
    var errors = fn.setAndValidateAST({
      inParams: ['a', 'b'],
      tasks: [
        { f: 'retObj', a: ['a.foo', 'b'], out: ['c'] },
        { f: 'concat', a: ['c.bar', 'b'], out: ['d'] }
      ],
      outTask: { a: ['c', 'd.result'] },
      locals: locals
    });
    t.deepEqual(errors, [], 'no validation errors');

    fn({ foo: 'FOO' }, 'B', function (err, c, dresult) {
      t.equal(err, null);
      t.deepEqual(c, { bar: 'FOOB' });
      t.equal(dresult, 'FOOBB');
      done();
    });
  });

  test('objects from locals', function (done) {
    var CONT = {
      retObj: function retObj(a, b, cb) { cb(null, { bar: a + b }); },
      concat: function concat(a, b, cb) { cb(null, { result: a + b }); }
    };

    var fn = react();
    var errors = fn.setAndValidateAST({
      inParams: ['a', 'b'],
      tasks: [
        { f: 'CONT.retObj', a: ['a.foo', 'b'], out: ['c'] },
        { f: 'CONT.concat', a: ['c.bar', 'b'], out: ['d'] }
      ],
      outTask: { a: ['c', 'd.result'] },
      locals: { CONT: CONT }
    });
    t.deepEqual(errors, [], 'no validation errors');

    fn({ foo: 'FOO' }, 'B', function (err, c, dresult) {
      t.equal(err, null);
      t.deepEqual(c, { bar: 'FOOB' });
      t.equal(dresult, 'FOOBB');
      done();
    });
  });

  test('multi-step func throws, cb with error', function (done) {
    var fn = react();
    var errors = fn.setAndValidateAST({
      inParams: ['a', 'b'],
      tasks: [
        { f: multiply, a: ['a', 'b'], out: ['c'] },
        { f: badFunc, a: ['c', 'b'], out: ['d'] }
      ],
      outTask: { a: ['c', 'd'] }
    });
    t.deepEqual(errors, [], 'no validation errors');

    fn(2, 3, function (err, c, d) {
      t.equal(err.message, 'badFuncThrow');
      done();
    });
  });

  test('multi-step func cb err, cb with error', function (done) {

    var fn = react();
    var errors = fn.setAndValidateAST({
      inParams: ['a', 'b'],
      tasks: [
        { f: multiply, a: ['a', 'b'], out: ['c'] },
        { f: badF2, a: ['c', 'b'], out: ['d'] },
        { f: add, a: ['d', 'b'], out: ['e'] }
      ],
      outTask: { a: ['c', 'e'] }
    });
    t.deepEqual(errors, [], 'no validation errors');

    fn(2, 3, function (err, c, d) {
      t.equal(err.message, 'my-error');
      done();
    });
  });

  test('using "this" in a cb function', function (done) {

    function getA(cb) {
      /*jshint validthis: true */
      cb(null, this.a);
    }

    var fn = react();
    var errors = fn.setAndValidateAST({
      inParams: [],
      tasks: [
        { f: getA, a: [], out: ['a'] }
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
      done();
    }]);
  });

  test('using "this" in a sync function', function (done) {
    function getA(cb) {
      /*jshint validthis: true */
      return this.a;
    }

    var fn = react();
    var errors = fn.setAndValidateAST({
      inParams: [],
      tasks: [
        { f: getA, a: [], out: ['a'], type: 'ret' }
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
      done();
    }]);
  });

  test('undefined input arguments will be upgraded from undefined to null', function (done) {
    var fn = react();
    function concat(a, b) {
      return '' + a + b;
    }
    var errors = fn.setAndValidateAST({
      inParams: ['a', 'b'],
      tasks: [
        { f: concat, a: ['a', 'b'], out: ['c'], type: 'ret' }
      ],
      outTask: { a: ['c'] }
    });
    t.deepEqual(errors, [], 'no validation errors');
    fn('first', undefined, function (err, c) {  // undefined second param, upgrade to null
      t.equal(err, null);
      t.equal(c, 'firstnull');
      done();
    });
  });



  // Select first tests


  test('selectFirst with first succeeding', function (done) {
    var fn = react();
    var errors = fn.setAndValidateAST({
      inParams: ['a', 'b'],
      tasks: [
        { f: multiply, a: ['a', 'b'], out: ['c'] },
        { f: add, a: ['a', 'b'], out: ['c'], after: ['multiply'] }
      ],
      outTask: { type: 'finalcbFirst', a: ['c'] }
    });
    t.deepEqual(errors, [], 'no validation errors');

    var collector = react.createEventCollector();
    collector.capture(fn, 'task.complete');

    fn(2, 3, function (err, c) {
      t.equal(err, null);
      t.equal(c, 6);
      var events = collector.list();
      t.equal(events.length, 1, 'should have seen one task compl events');
      t.equal(events[0].task.name, 'multiply', 'name matches');
      t.deepEqual(events[0].task.results, [6], 'results match');
      done();
    });
  });

  test('selectFirst with third succeeding', function (done) {
    function noSuccess(a, b, cb) { cb(null); } // returns undefined result
    function noSuccessNull(a, b, cb) { cb(null, null); } // returns null result
    var fn = react();
    var errors = fn.setAndValidateAST({
      inParams: ['a', 'b'],
      tasks: [
        { f: noSuccess, a: ['a', 'b'], out: ['c'] },
        { f: noSuccessNull, a: ['a', 'b'], out: ['c'], after: ['noSuccess'] },
        { f: add, a: ['a', 'b'], out: ['c'], after: ['noSuccessNull'] }
      ],
      outTask: { type: 'finalcbFirst', a: ['c'] }
    });
    t.deepEqual(errors, [], 'no validation errors');

    var collector = react.createEventCollector();
    collector.capture(fn, 'task.complete');

    fn(2, 3, function (err, c) {
      t.equal(err, null);
      t.equal(c, 5);
      var events = collector.list();
      t.equal(events.length, 3, 'should have seen three task compl events');
      t.equal(events[2].task.name, 'add', 'name matches');
      t.deepEqual(events[2].task.results, [5], 'results match');
      done();
    });
  });


  test('selectFirst forces order with third succeeding', function (done) {
    function noSuccess(a, b, cb) {
      setTimeout(function () { cb(null); }, 100); // returns undefined result
    }
    function noSuccessNull(a, b, cb) { cb(null, null); } // returns null result
    var fn = react();
    var errors = fn.setAndValidateAST({
      inParams: ['a', 'b'],
      tasks: [
        { f: noSuccess, a: ['a', 'b'], out: ['c'] },
        { f: noSuccessNull, a: ['a', 'b'], out: ['c'], after: ['noSuccess']},
        { f: add, a: ['a', 'b'], out: ['c'], after: ['noSuccessNull'] },
        { f: noSuccess, a: ['a', 'b'], out: ['c'], after: ['add'] }
      ],
      outTask: { type: 'finalcbFirst', a: ['c'] }
    });
    t.deepEqual(errors, [], 'no validation errors');

    var collector = react.createEventCollector();
    collector.capture(fn, 'task.complete');

    fn(2, 3, function (err, c) {
      t.equal(err, null);
      t.equal(c, 5);
      var events = collector.list();
      t.equal(events.length, 3, 'should have seen three task compl events');
      t.equal(events[0].task.name, 'noSuccess', 'name matches');
      t.equal(events[1].task.name, 'noSuccessNull', 'name matches');
      t.equal(events[2].task.name, 'add', 'name matches');
      t.deepEqual(events[2].task.results, [5], 'results match');
      done();
    });
  });

  test('selectFirst using direct returns', function (done) {
    function noSuccess(a, b) {  } // returns undefined result
    function noSuccessNull(a, b) { return null; } // returns null result
    function addRet(a, b) { return a + b; }
    var fn = react();
    var errors = fn.setAndValidateAST({
      inParams: ['a', 'b'],
      tasks: [
        { f: noSuccess, a: ['a', 'b'], out: ['c'], type: 'ret' },
        { f: noSuccessNull, a: ['a', 'b'], out: ['c'], type: 'ret', after: ['noSuccess'] },
        { f: addRet, a: ['a', 'b'], out: ['c'], type: 'ret', after: ['noSuccessNull'] }
      ],
      outTask: { type: 'finalcbFirst', a: ['c'] }
    });
    t.deepEqual(errors, [], 'no validation errors');

    var collector = react.createEventCollector();
    collector.capture(fn, 'task.complete');

    fn(2, 3, function (err, c) {
      t.equal(err, null);
      t.equal(c, 5);
      var events = collector.list();
      t.equal(events.length, 3, 'should have seen three task compl events');
      t.equal(events[2].task.name, 'addRet', 'name matches');
      t.deepEqual(events[2].task.results, [5], 'results match');
      done();
    });
  });


}());