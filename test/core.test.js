'use strict';

var test = require('tap').test;

var react = require('../react');

function multiply(x, y, cb) { cb(null, x * y); }
function add(x, y, cb) { cb(null, x + y); }
function badFunc(a, b, cb) { throw new Error('badFuncThrow'); }
function badF2(a, b, cb) { cb('my-error'); }
function fnRetsSum(a, b) { return a + b; }

test('set and validate AST', function (t) {
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
  t.end();
});

test('unnamed tasks will be assigned unique names', function (t) {
  var fn = react();
  var errors = fn.setAndValidateAST({
    inParams: ['a', 'b'],
    tasks: [
      { f: multiply, a: ['a', 'b'], out: ['c'] },
      { f: multiply, a: ['a', 'b'], out: ['d'], name: 'multiply' },
      { f: multiply, a: ['a', 'b'], out: ['e'], name: 'times' },
      { f: multiply, a: ['a', 'b'], out: ['f'] }
    ],
    outTask: { a: ['c'] }
  });
  t.deepEqual(errors, [], 'should set and validate as true');
  t.deepEqual(fn.ast.tasks, [
      { f: multiply, a: ['a', 'b'], out: ['c'], type: 'cb', name: 'multiply_0' },
      { f: multiply, a: ['a', 'b'], out: ['d'], name: 'multiply', type: 'cb' },
      { f: multiply, a: ['a', 'b'], out: ['e'], name: 'times', type: 'cb' },
      { f: multiply, a: ['a', 'b'], out: ['f'], type: 'cb', name: 'multiply_3' }
    ]);
  t.end();
});


test('execution with no errors should call callback with result', function (t) {
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
    t.end();
  });
});

test('multi-step', function (t) {
  t.plan(4);
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
    t.end();
  });
});  

test('multi-step with after as nonarr fn', function (t) {
  t.plan(7);
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

  var events = [];
  function accumEvents(task) {
    events.push(task);
  }
  fn.events.on('task.complete', accumEvents);
  
  fn(2, 3, function (err, c, d) {
    t.equal(err, null);
    t.equal(c, 6);
    t.equal(d, 5);
    t.equal(events.length, 2, 'should have seen one task compl events');
    t.equal(events[0].name, 'add', 'name matches');
    t.equal(events[1].name, 'multiply', 'name matches');
    t.end();
  });
});  

test('mixed multi-step with after as nonarr fn w/events', function (t) {
  t.plan(19);
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

  var events = [];
  function accumEvents(task) {
    events.push(task);
  }
  fn.events.on('task.complete', accumEvents);
  
  fn(2, 3, function (err, c, d) {
    t.equal(err, null);
    t.equal(c, 6);
    t.equal(d, 5);
    t.equal(events.length, 2, 'should have seen one task compl events');
    t.equal(events[0].name, 'fnRetsSum', 'name matches');
    t.ok(events[0].id, 'has unique id');
    t.ok(events[0].startTime, 'has startTime');
    t.ok(events[0].endTime, 'has endTime');
    t.ok(events[0].elapsedTime !== undefined, 'has elapsedTime');    
    t.ok(events[0].args, 'has args');
    t.ok(events[0].results, 'has results');
    t.equal(events[1].name, 'multiply', 'name matches');
    t.ok(events[1].id, 'has unique id');
    t.ok(events[1].startTime, 'has startTime');
    t.ok(events[1].endTime, 'has endTime');
    t.ok(events[1].elapsedTime !== undefined, 'has elapsedTime');    
    t.ok(events[1].args, 'has args');
    t.ok(events[1].results, 'has results');
    t.end();
  });
});  




test('sets obj values', function (t) {
  t.plan(5);
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
    t.end();
  });
});  

test('error when cant complete', function (t) {
  t.plan(2);
  var fn = react();
  var errors = fn.setAndValidateAST({
    inParams: ['a', 'b', 'c'],
    tasks: [    
      { f: multiply, a: ['a', 'b'], out: ['c.mult'] },
      { f: fnRetsSum, a: ['c.bad', 'b'], out: ['c.sum'], type: 'ret' }
    ],
    outTask: { a: ['c.mult', 'c.sum', 'c'] }
  });
  t.deepEqual(errors, [], 'no validation errors');

  fn(2, 3, { foo: 1 }, function (err, cmult, csum, c) {
    t.equal(err.message, 'no tasks running, flow will not complete');
    t.end();
  });
});


test('objects', function (t) {
  function retObj(a, b, cb) { cb(null, { bar: a + b }); }
  function concat(a, b, cb) { cb(null, { result: a + b }); }
  t.plan(4);
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
    t.end();
  });
});  

test('objects from container', function (t) {
  var C = {
    retObj: function retObj(a, b, cb) { cb(null, { bar: a + b }); },
    concat: function concat(a, b, cb) { cb(null, { result: a + b }); }
  };
  t.plan(4);
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
    t.end();
  });
});  

test('objects from container input arg', function (t) {
  var CONT = {
    retObj: function retObj(a, b, cb) { cb(null, { bar: a + b }); },
    concat: function concat(a, b, cb) { cb(null, { result: a + b }); }
  };
  t.plan(4);
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
    t.end();
  });
});  

test('use locals for functions', function (t) {
  var locals = {
    retObj: function retObj(a, b, cb) { cb(null, { bar: a + b }); },
    concat: function concat(a, b, cb) { cb(null, { result: a + b }); }
  };
  t.plan(4);
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
    t.end();
  });
});  

test('objects from locals', function (t) {
  var CONT = {
    retObj: function retObj(a, b, cb) { cb(null, { bar: a + b }); },
    concat: function concat(a, b, cb) { cb(null, { result: a + b }); }
  };
  t.plan(4);
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
    t.end();
  });
});  
  
test('multi-step func throws, cb with error', function (t) {
  t.plan(2);
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
    t.end();
  });
});  
  
test('multi-step func cb err, cb with error', function (t) {
  t.plan(2);
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
    t.end();
  });
});  
  

test('selectFirst with first succeeding', function (t) {
  t.plan(6);
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

  var events = [];
  function accumEvents(task) {
    events.push(task);
  }
  fn.events.on('task.complete', accumEvents);

  fn(2, 3, function (err, c, d) {
    t.equal(err, null);
    t.equal(c, 6);
    t.equal(events.length, 1, 'should have seen one task compl events');
    t.equal(events[0].name, 'multiply', 'name matches');
    t.deepEqual(events[0].results, [6], 'results match');
    t.end();
  });
});  

test('selectFirst with third succeeding', function (t) {
  function noSuccess(a, b, cb) { cb(null); } // returns undefined result
  function noSuccessNull(a, b, cb) { cb(null, null); } // returns null result
  
  t.plan(6);
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

  var events = [];
  function accumEvents(task) {
    events.push(task);
  }
  fn.events.on('task.complete', accumEvents);

  fn(2, 3, function (err, c, d) {
    t.equal(err, null);
    t.equal(c, 5);
    t.equal(events.length, 3, 'should have seen three task compl events');
    t.equal(events[2].name, 'add', 'name matches');
    t.deepEqual(events[2].results, [5], 'results match');
    t.end();
  });
});  


test('selectFirst forces order with third succeeding', function (t) {
  function noSuccess(a, b, cb) {
    setTimeout(function () { cb(null); }, 100); // returns undefined result
  }
  function noSuccessNull(a, b, cb) { cb(null, null); } // returns null result
  
  t.plan(8);
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

  var events = [];
  function accumEvents(task) {
    events.push(task);
  }
  fn.events.on('task.complete', accumEvents);

  fn(2, 3, function (err, c, d) {
    t.equal(err, null);
    t.equal(c, 5);
    t.equal(events.length, 3, 'should have seen three task compl events');
    t.equal(events[0].name, 'noSuccess', 'name matches');
    t.equal(events[1].name, 'noSuccessNull', 'name matches');
    t.equal(events[2].name, 'add', 'name matches');
    t.deepEqual(events[2].results, [5], 'results match');
    t.end();
  });
});  




test('selectFirst using direct returns', function (t) {
  function noSuccess(a, b) {  } // returns undefined result
  function noSuccessNull(a, b) { return null; } // returns null result
  function addRet(a, b) { return a + b; }
  
  t.plan(6);
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

  var events = [];
  function accumEvents(task) {
    events.push(task);
  }
  fn.events.on('task.complete', accumEvents);

  fn(2, 3, function (err, c, d) {
    t.equal(err, null);
    t.equal(c, 5);
    t.equal(events.length, 3, 'should have seen three task compl events');
    t.equal(events[2].name, 'addRet', 'name matches');
    t.deepEqual(events[2].results, [5], 'results match');
    t.end();
  });
});  


