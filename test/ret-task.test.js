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

test('no args defined, no after is not ready', function (t) {
  var task = new RetTask({ type: 'ret', f: foo, a: ['b'], ret: null });
  var vCon = VContext.create([], []);
  var tasksByName = { foo: task };
  t.equal(task.isReady(vCon, tasksByName), false);
  t.end();
});

test('all args defined, no after is ready', function (t) {
  var task = new RetTask({ type: 'ret', f: foo, a: ['b', 'c'], ret: null });
  var vCon = VContext.create([1, 2], ['b', 'c']);
  var tasksByName = { foo: task };
  t.equal(task.isReady(vCon, tasksByName), true);
  t.end();  
});

test('all args defined, after not complete is NOT ready', function (t) {
  var tcat = new RetTask({ type: 'ret', f: cat, a: [], ret: null, status: 'complete' });
  var tbar = new RetTask({ type: 'ret', f: bar, a: [], ret: null, status: 'running' });
  var task = new RetTask(
    { type: 'ret', f: foo, a: ['b', 'c'], ret: null, after: ['cat', 'bar']});
  var vCon = VContext.create([1, 2], ['b', 'c']);
  var tasksByName = { foo: task, bar: tbar, cat: tcat };
  t.equal(task.isReady(vCon, tasksByName), false);  
  t.end();  
});

test('all args defined, after all complete is ready', function (t) {
  var tcat = new RetTask({ type: 'ret', f: cat, a: [], ret: null, status: 'complete' });
  var tbar = new RetTask({ type: 'ret', f: bar, a: [], ret: null, status: 'complete' });
  var task = new RetTask(
    { type: 'ret', f: foo, a: ['b', 'c'], ret: null, after: ['cat', 'bar']});
  var vCon = VContext.create([1, 2], ['b', 'c']);
  var tasksByName = { foo: task, bar: tbar, cat: tcat };
  t.equal(task.isReady(vCon, tasksByName), true);  
  t.end();  
});



