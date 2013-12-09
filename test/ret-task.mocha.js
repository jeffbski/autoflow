/*global autoflow:true RetTask:true VContext:true */

if (typeof(chai) === 'undefined') {
  var chai = require('chai');
}

if (typeof(autoflow) === 'undefined') {
  var autoflow = require('../'); //require('autoflow');
}

if (typeof(RetTask) === 'undefined') {
  var RetTask = require('../lib/ret-task.js');
}

if (typeof(VContext) === 'undefined') {
  var VContext = require('../lib/vcon.js');
}

(function () {
  'use strict';

  var t = chai.assert;

  /**
     Testing VContext
  */

  suite('ret-task');

  function foo() { }
  function bar() { }
  function cat() { }

  test('new task is not complete', function (done) {
    var task = new RetTask({ type: 'ret', f: foo, a: [], out: [] });
    t.equal(task.isComplete(), false);
    done();
  });

  test('ready task is not complete', function (done) {
    var task = new RetTask({ type: 'ret', f: foo, a: [], out: [], status: 'ready'});
    t.equal(task.isComplete(), false);
    done();
  });

  test('running task is not complete', function (done) {
    var task = new RetTask({ type: 'ret', f: foo, a: [], out: [], status: 'running'});
    t.equal(task.isComplete(), false);
    done();
  });

  test('complete task is complete', function (done) {
    var task = new RetTask({ type: 'ret', f: foo, a: [], out: [], status: 'complete' });
    t.equal(task.isComplete(), true);
    done();
  });

  test('task with any status is not ready', function (done) {
    var task = new RetTask({ type: 'ret', f: foo, a: [], out: [], status: 'complete' });
    var vCon = VContext.create([], []);
    var tasksByName = { foo: task };
    t.equal(task.isReady(vCon, tasksByName), false);
    task.status = 'ready';
    t.equal(task.isReady(vCon, tasksByName), false);
    task.status = 'running';
    t.equal(task.isReady(vCon, tasksByName), false);
    task.status = null;
    t.equal(task.isReady(vCon, tasksByName), true);
    done();
  });

  test('no args defined, no after -> not ready', function (done) {
    var task = new RetTask({ type: 'ret', f: foo, a: ['b'], out: [] });
    var vCon = VContext.create([], []);
    var tasksByName = { foo: task };
    t.equal(task.isReady(vCon, tasksByName), false);
    done();
  });

  test('obj prop undefined -> NOT ready', function (done) {
    var task = new RetTask({ type: 'ret', f: foo, a: ['b', 'c.prop'], out: [] });
    var vCon = VContext.create([1, {}], ['b', 'c']);
    var tasksByName = { foo: task };
    t.equal(task.isReady(vCon, tasksByName), false);
    done();
  });

  test('all args defined, no after, out no obj parent -> NOT ready', function (done) {
    var task = new RetTask({ type: 'ret', f: foo, a: ['b', 'c'], out: ['d.e'] });
    var vCon = VContext.create([1, null], ['b', 'c']);
    var tasksByName = { foo: task };
    t.equal(task.isReady(vCon, tasksByName), false, 'false if out objparent undef');
    done();
  });

  test('all args defined, no after, out no obj.par.par -> NOT ready', function (done) {
    var task = new RetTask({ type: 'ret', f: foo, a: ['b', 'c'], out: ['c.e.f'] });
    var vCon = VContext.create([1, { }], ['b', 'c']);
    var tasksByName = { foo: task };
    t.equal(task.isReady(vCon, tasksByName), false, 'false if out objparent undef');
    done();
  });

  test('all args defined, no after, out null obj parent -> NOT ready', function (done) {
    var task = new RetTask({ type: 'ret', f: foo, a: ['b', 'c'], out: ['c.e'] });
    var vCon = VContext.create([1, null], ['b', 'c']);
    var tasksByName = { foo: task };
    t.equal(task.isReady(vCon, tasksByName), false, 'false if out objparent null');
    done();
  });

  test('all args defined, no after, out null obj.par.par -> NOT ready', function (done) {
    var task = new RetTask({ type: 'ret', f: foo, a: ['b', 'c'], out: ['c.e.f'] });
    var vCon = VContext.create([1, { e: null }], ['b', 'c']);
    var tasksByName = { foo: task };
    t.equal(task.isReady(vCon, tasksByName), false, 'false if out objparent null');
    done();
  });

  test('all args defined, no after -> ready', function (done) {
    var task = new RetTask({ type: 'ret', f: foo, a: ['b', 'c'], out: [] });
    var vCon = VContext.create([1, null], ['b', 'c']);
    var tasksByName = { foo: task };
    t.equal(task.isReady(vCon, tasksByName), true);
    done();
  });

  test('all args defined, obj prop null, no after -> ready', function (done) {
    var task = new RetTask({ type: 'ret', f: foo, a: ['b', 'c.prop'], out: [] });
    var vCon = VContext.create([1, { prop: null }], ['b', 'c']);
    var tasksByName = { foo: task };
    t.equal(task.isReady(vCon, tasksByName), true);
    done();
  });

  test('all args defined, after not complete -> NOT ready', function (done) {
    var tcat = new RetTask({ type: 'ret', f: cat, a: [], out: [], status: 'complete' });
    var tbar = new RetTask({ type: 'ret', f: bar, a: [], out: [], status: 'running' });
    var task = new RetTask(
      { type: 'ret', f: foo, a: ['b', 'c'], out: [], after: ['cat', 'bar']});
    var vCon = VContext.create([1, 2], ['b', 'c']);
    var tasksByName = { foo: task, bar: tbar, cat: tcat };
    t.equal(task.isReady(vCon, tasksByName), false);
    done();
  });

  test('all args defined, after all complete -> ready', function (done) {
    var tcat = new RetTask({ type: 'ret', f: cat, a: [], out: [], status: 'complete' });
    var tbar = new RetTask({ type: 'ret', f: bar, a: [], out: [], status: 'complete' });
    var task = new RetTask(
      { type: 'ret', f: foo, a: ['b', 'c'], out: [], after: ['cat', 'bar']});
    var vCon = VContext.create([1, 2], ['b', 'c']);
    var tasksByName = { foo: task, bar: tbar, cat: tcat };
    t.equal(task.isReady(vCon, tasksByName), true);
    done();
  });

  test('string without . is not method call', function (done) {
    var task = new RetTask({ type: 'ret', f: 'foo', a: [], out: ['b'] });
    t.equal(task.isMethodCall(), false);
    task.f = null;
    t.equal(task.isMethodCall(), false);
    done();
  });

  test('string with . is method call', function (done) {
    var task = new RetTask({ type: 'ret', f: 'foo.bar', a: [], out: ['b'] });
    t.equal(task.isMethodCall(), true);
    task.f = 'foo.bar.baz';
    t.equal(task.isMethodCall(), true);
    done();
  });

  test('undefined or null fn - functionExists', function (done) {
    var task = new RetTask({ type: 'ret', f: 'foo', a: [], out: ['b'] });
    var vCon = VContext.create([], []);
    task.f = null;
    t.isFalse(task.functionExists(vCon));
    task.f = undefined;
    t.isFalse(task.functionExists(vCon));
    task.f = 'foo';
    t.isFalse(task.functionExists(vCon));
    vCon.values.foo = { };
    task.f = 'foo.bar';
    t.isFalse(task.functionExists(vCon));
    done();
  });

  test('functionExists', function (done) {
    var task = new RetTask({ type: 'ret', f: foo, a: [], out: ['b'] });
    var vCon = VContext.create([], []);
    t.isTrue(task.functionExists(vCon));
    done();
  });

  test('method functionExists', function (done) {
    var task = new RetTask({ type: 'ret', f: 'foo.b', a: [], out: ['b'] });
    var vCon = VContext.create([{b: bar}], ['foo']);
    t.isTrue(task.functionExists(vCon));
    task.f = 'foo.bar.cat';
    vCon.values.foo = { bar: { cat: cat}};
    t.isTrue(task.functionExists(vCon));
    done();
  });

  test('getMethodObj non-existent return undefined', function (done) {
    var task = new RetTask({ type: 'ret', f: 'foo.b.c', a: [], out: ['b'] });
    var vCon = VContext.create([{}], ['foo']);
    t.equal(task.getMethodObj(vCon), undefined);
    done();
  });

  test('getMethodObj returns object', function (done) {
    var task = new RetTask({ type: 'ret', f: 'foo.b', a: [], out: ['b'] });
    var vCon = VContext.create([{b: bar}], ['foo']);
    t.deepEqual(task.getMethodObj(vCon), { b: bar});
    done();
  });

}());
