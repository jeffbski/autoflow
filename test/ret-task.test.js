'use strict';

var test = require('tap').test;

var RetTask = require('../lib/ret-task.js');
var VContext = require('../lib/vcon.js');

function foo() { }
function bar() { }
function cat() { }

test('new task is not complete', function (t) {
  var task = new RetTask({ type: 'ret', f: foo, a: [], ret: null});
  t.equal(task.isComplete(), false);
  t.end();
});

test('ready task is not complete', function (t) {
  var task = new RetTask({ type: 'ret', f: foo, a: [], ret: null, status: 'ready'});
  t.equal(task.isComplete(), false);
  t.end();
});

test('running task is not complete', function (t) {
  var task = new RetTask({ type: 'ret', f: foo, a: [], ret: null, status: 'running'});
  t.equal(task.isComplete(), false);
  t.end();
});

test('complete task is complete', function (t) {
  var task = new RetTask({ type: 'ret', f: foo, a: [], ret: null, status: 'complete' });
  t.equal(task.isComplete(), true);
  t.end();
});

test('task with any status is not ready', function (t) {
  var task = new RetTask({ type: 'ret', f: foo, a: [], ret: null, status: 'complete' });
  var vCon = VContext.create([], []);
  var tasksByName = { foo: task };
  t.equal(task.isReady(vCon, tasksByName), false);
  task.status = 'ready';
  t.equal(task.isReady(vCon, tasksByName), false);
  task.status = 'running';
  t.equal(task.isReady(vCon, tasksByName), false);
  task.status = null;
  t.equal(task.isReady(vCon, tasksByName), true);
  t.end();  
});

test('no args defined, no after -> not ready', function (t) {
  var task = new RetTask({ type: 'ret', f: foo, a: ['b'], ret: null });
  var vCon = VContext.create([], []);
  var tasksByName = { foo: task };
  t.equal(task.isReady(vCon, tasksByName), false);
  t.end();
});

test('obj prop undefined -> NOT ready', function (t) {
  var task = new RetTask({ type: 'ret', f: foo, a: ['b', 'c.prop'], ret: null });
  var vCon = VContext.create([1, {}], ['b', 'c']);
  var tasksByName = { foo: task };
  t.equal(task.isReady(vCon, tasksByName), false);
  t.end();  
});

test('all args defined, no after, out no obj parent -> NOT ready', function (t) {
  var task = new RetTask({ type: 'ret', f: foo, a: ['b', 'c'], ret: 'd.e' });
  var vCon = VContext.create([1, null], ['b', 'c']);
  var tasksByName = { foo: task };
  t.equal(task.isReady(vCon, tasksByName), false, 'false if out objparent undef');  
  t.end();  
});

test('all args defined, no after, out no obj.par.par -> NOT ready', function (t) {
  var task = new RetTask({ type: 'ret', f: foo, a: ['b', 'c'], ret: 'c.e.f' });
  var vCon = VContext.create([1, { }], ['b', 'c']);
  var tasksByName = { foo: task };
  t.equal(task.isReady(vCon, tasksByName), false, 'false if out objparent undef');  
  t.end();  
});

test('all args defined, no after, out null obj parent -> NOT ready', function (t) {
  var task = new RetTask({ type: 'ret', f: foo, a: ['b', 'c'], ret: 'c.e' });
  var vCon = VContext.create([1, null], ['b', 'c']);
  var tasksByName = { foo: task };
  t.equal(task.isReady(vCon, tasksByName), false, 'false if out objparent null');  
  t.end();  
});

test('all args defined, no after, out null obj.par.par -> NOT ready', function (t) {
  var task = new RetTask({ type: 'ret', f: foo, a: ['b', 'c'], ret: 'c.e.f' });
  var vCon = VContext.create([1, { e: null }], ['b', 'c']);
  var tasksByName = { foo: task };
  t.equal(task.isReady(vCon, tasksByName), false, 'false if out objparent null');  
  t.end();  
});

test('all args defined, no after -> ready', function (t) {
  var task = new RetTask({ type: 'ret', f: foo, a: ['b', 'c'], ret: null });
  var vCon = VContext.create([1, null], ['b', 'c']);
  var tasksByName = { foo: task };
  t.equal(task.isReady(vCon, tasksByName), true);
  t.end();  
});

test('all args defined, obj prop null, no after -> ready', function (t) {
  var task = new RetTask({ type: 'ret', f: foo, a: ['b', 'c.prop'], ret: null });
  var vCon = VContext.create([1, { prop: null }], ['b', 'c']);
  var tasksByName = { foo: task };
  t.equal(task.isReady(vCon, tasksByName), true);
  t.end();  
});

test('all args defined, after not complete -> NOT ready', function (t) {
  var tcat = new RetTask({ type: 'ret', f: cat, a: [], ret: null, status: 'complete' });
  var tbar = new RetTask({ type: 'ret', f: bar, a: [], ret: null, status: 'running' });
  var task = new RetTask(
    { type: 'ret', f: foo, a: ['b', 'c'], ret: null, after: ['cat', 'bar']});
  var vCon = VContext.create([1, 2], ['b', 'c']);
  var tasksByName = { foo: task, bar: tbar, cat: tcat };
  t.equal(task.isReady(vCon, tasksByName), false);  
  t.end();  
});

test('all args defined, after all complete -> ready', function (t) {
  var tcat = new RetTask({ type: 'ret', f: cat, a: [], ret: null, status: 'complete' });
  var tbar = new RetTask({ type: 'ret', f: bar, a: [], ret: null, status: 'complete' });
  var task = new RetTask(
    { type: 'ret', f: foo, a: ['b', 'c'], ret: null, after: ['cat', 'bar']});
  var vCon = VContext.create([1, 2], ['b', 'c']);
  var tasksByName = { foo: task, bar: tbar, cat: tcat };
  t.equal(task.isReady(vCon, tasksByName), true);  
  t.end();  
});

test('string without . is not method call', function (t) {
  var task = new RetTask({ type: 'ret', f: 'foo', a: [], ret: 'b' });
  t.equal(task.isMethodCall(), false);
  task.f = null;
  t.equal(task.isMethodCall(), false);
  t.end();
});

test('string with . is method call', function (t) {
  var task = new RetTask({ type: 'ret', f: 'foo.bar', a: [], ret: 'b' });
  t.equal(task.isMethodCall(), true);
  task.f = 'foo.bar.baz';
  t.equal(task.isMethodCall(), true);
  t.end();
});

test('undefined or null fn - functionExists', function (t) {
  var task = new RetTask({ type: 'ret', f: 'foo', a: [], ret: 'b' });
  var vCon = VContext.create([], []);
  task.f = null;
  t.notOk(task.functionExists(vCon));
  task.f = undefined;
  t.notOk(task.functionExists(vCon));
  task.f = 'foo';
  t.notOk(task.functionExists(vCon));
  vCon.values.foo = { };
  task.f = 'foo.bar';
  t.notOk(task.functionExists(vCon));
  t.end();
});

test('functionExists', function (t) {
  var task = new RetTask({ type: 'ret', f: foo, a: [], ret: 'b' });
  var vCon = VContext.create([], []);
  t.ok(task.functionExists(vCon));
  t.end();
});

test('method functionExists', function (t) {
  var task = new RetTask({ type: 'ret', f: 'foo.b', a: [], ret: 'b' });
  var vCon = VContext.create([{b: bar}], ['foo']);
  t.ok(task.functionExists(vCon));
  task.f = 'foo.bar.cat';
  vCon.values.foo = { bar: { cat: cat}};
  t.ok(task.functionExists(vCon));
  t.end();
});

test('getMethodObj non-existent return undefined', function (t) {
  var task = new RetTask({ type: 'ret', f: 'foo.b.c', a: [], ret: 'b' });
  var vCon = VContext.create([{}], ['foo']);
  t.equal(task.getMethodObj(vCon), undefined);
  t.end();
});

test('getMethodObj returns object', function (t) {
  var task = new RetTask({ type: 'ret', f: 'foo.b', a: [], ret: 'b' });
  var vCon = VContext.create([{b: bar}], ['foo']);
  t.deepEqual(task.getMethodObj(vCon), { b: bar});
  t.end();
});



