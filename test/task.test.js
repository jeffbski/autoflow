'use strict';

var test = require('tap').test;

var tk = require('../lib/task.js'); 

function foo() { }

test('findMatchingTaskType should match the proper types from taskDef', function (t) {
  function findAndGetType(taskDef) { return tk.findMatchingTaskType(taskDef).taskType.value; }
  t.equal(tk.findMatchingTaskType({}), null, 'invalid taskDef should return null');
  t.equal(findAndGetType({ f: foo, a: [], cb: []}), 'cb', 'fn with empty cbArgs should match type cb');
  t.equal(findAndGetType({ f: 'foo', a: [], cb: []}), 'cb', 'fnstr with empty cbArgs should match type cb');
  t.equal(findAndGetType({ f: foo, a: [], ret: 'z'}), 'ret', 'fn with ret should match type ret');
  t.equal(findAndGetType({ f: 'foo.bar', a: [], cb: []}), 'cb', 'method w/cbArgs cb'); 
  t.equal(findAndGetType({ f: 'foo.bar', a: [], ret: 'z'}), 'ret', 'method w/ret ret'); 
  t.equal(findAndGetType({ finalCb: 'foo.bar', a: []}), 'finalCb', 'method finalCb'); 
  t.end();
});

test('taskFactory should create proper task type from taskDef', function (t) {
  var execCon = {};
  t.equal(tk.taskFactory({ f: foo, a: [], cb: []}, execCon).taskType, 'cb', 'fn with empty cbArgs type cb');
  t.equal(tk.taskFactory({ f: 'foo', a: [], cb: []}, execCon).taskType, 'cb', 'fnstr with empty cbArgs type cb');
  t.equal(tk.taskFactory({ f: foo, a: [], ret: 'z'}, execCon).taskType, 'ret', 'fn with ret type ret');
  t.equal(tk.taskFactory({ f: 'foo.bar', a: [], cb: []}, execCon).taskType, 'cb', 'method w/cbArgs type cb'); 
  t.equal(tk.taskFactory({ f: 'foo.bar', a: [], ret: 'z'}, execCon).taskType, 'ret', 'method w/ret type ret');
  t.equal(tk.taskFactory({ finalCb: 'foo.bar', a: []}, execCon).taskType, 'finalCb', 'method finalCb'); 
  t.end();  
});