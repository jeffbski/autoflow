'use strict';

var test = require('tap').test;
var util = require('util');
var sprintf = require('sprintf').sprintf;

var validate = require('../lib/validate.js');
var tutil = require('../lib/task.js');

function foo() { }
function bar() { }

test('empty ast is invalid', function (t) {
  t.deepEqual(validate(), ['ast must be an object with inParams, tasks, and outTask']);
  t.deepEqual(validate({}), ['ast must be an object with inParams, tasks, and outTask']);
  t.deepEqual(validate({ inParams: [] }), ['ast must be an object with inParams, tasks, and outTask']);
  t.deepEqual(validate({ tasks: [] }), ['ast must be an object with inParams, tasks, and outTask']);
  t.deepEqual(validate({ tasks: [], outTask: {} }), ['ast must be an object with inParams, tasks, and outTask']);
  t.deepEqual(validate({ outTask: {} }), ['ast must be an object with inParams, tasks, and outTask']);
  t.end();
});

test('ast.inParams must be an array of strings', function (t) {
  var ast = {
    inParams: 'a',  //err should be an array
    tasks: [{ f: foo, in: [], out: ['bar'], type: 'ret' }],
    outTask: { in: ['bar'] }
  };
  t.deepEqual(validate(ast), ['ast.inParams must be an array of strings']);

  ast.inParams = [1]; //err not an array of strings
  t.deepEqual(validate(ast), ['ast.inParams must be an array of strings']);  
  t.end();
});

test('ast.tasks must be an array of tasks', function (t) {
  var ast = {
    inParams: ['a'],
    tasks: 'bar', //err should be array
    outTask: { in: ['bar'] }
  };
  t.deepEqual(validate(ast), ['ast.tasks must be an array of tasks']);
  t.end();
});

test('each task must be an object', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [1],  //err not array of objects
    outTask: { in: ['bar'] }
  };
  t.deepEqual(validate(ast), ['task must be an object - 1']);  
  t.end();
  
});


test('each task in ast.tasks must match a valid task type', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [{ type: 'zoo', f: foo, in: [], out: ['bar'] }], //err wrong type
    outTask: { in: ['bar'] }
  };
  var msg = sprintf('task.type should match one of %s - %s',
                    tutil.taskTypeKeys().join(', '), util.inspect(ast.tasks[0]));
  t.deepEqual(validate(ast), [msg]);
  t.end();
});

test('ast.outTask.in should be an array of string param names', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [{ f: foo, in: [], out: ['bar'], type: 'ret' }], 
    outTask: { in: ['bar'] }
  };
  ast.outTask = {}; //err a should be an arr
  var msg = sprintf('ast.outTask.in should be an array of string param names - %s',
                    util.inspect({ type: 'finalcb' }));
  t.deepEqual(validate(ast), [msg]);  

  ast.outTask = { type: 'finalcb', in: 'bar' }; //err a should be an arr
  msg = sprintf('ast.outTask.in should be an array of string param names - %s',
                    util.inspect(ast.outTask));
  t.deepEqual(validate(ast), [msg]);  

  ast.outTask = { type: 'finalcb', in: ['bar', 1] }; //err a should be an arr of strings
  msg = sprintf('ast.outTask.in should be an array of string param names - %s',
                    util.inspect(ast.outTask));
  t.deepEqual(validate(ast), [msg]);  

  ast.outTask = { in: [] }; //valid
  t.deepEqual(validate(ast), []);  
  t.end();
});

test('ast.tasks that specify name need to be unique', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [
      { f: foo, in: [], out: ['bar'], name: 'dog' },
      { f: foo, in: [], out: ['bar'], name: 'dog' }
    ], 
    outTask: { in: ['bar'] }
  };
  var msg = sprintf('ast.tasks that specify name need to be unique, duplicate: %s',
                    'dog');
  t.deepEqual(validate(ast), [msg]);  
  t.end();
});
  
test('ast.locals should be non-null if passed in', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [{ f: foo, in: [], out: ['bar'], type: 'ret' }],
    outTask: { in: ['bar'] },
    locals: null  //err should be non-null if passed in
  };
  t.deepEqual(validate(ast), ['ast.locals should not be null']);

  ast.locals = { };
  t.deepEqual(validate(ast), []);
  t.end();
});

test('non-method string functions need to map to fn in locals or in params', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [{ f: 'foo', in: [], out: ['bar'], type: 'ret' }],
    outTask: { in: ['bar'] },
    locals: { }
  };
  var msg = sprintf('function: %s not found in locals or input params - task[%s]', 
                    'foo', 0);
  t.deepEqual(validate(ast), [msg]);  
  t.end();
});

test('string functions maps to fn in locals', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [{ f: 'cat.bar', in: [], out: ['bar'], type: 'ret' }],
    outTask: { in: ['bar'] },
    locals: { cat: { bar: foo }}
  };
  t.deepEqual(validate(ast), []);  
  t.end();
});

test('string functions maps to fn in inputs', function (t) {
  var ast = {
    inParams: ['a1', 'dog'], 
    tasks: [{ f: 'dog.food', in: [], out: ['bar'], type: 'ret' }],
    outTask: { in: ['bar'] },
    locals: { }
  };
  t.deepEqual(validate(ast), []);  
  t.end();
});

test('string functions need to map to fn in locals or in params', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [{ f: 'foo.bar', in: [], out: ['bar'], type: 'ret' }],
    outTask: { in: ['bar'] },
    locals: { foo: {}}
  };
  var msg = sprintf('function: %s not found in locals or input params - task[%s]', 
                    'foo.bar', 0);
  t.deepEqual(validate(ast), [msg]);  
  t.end();
});

test('param func str fn need to map to fn in locals or in params', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [{ f: 'a', in: [], out: ['bar'], type: 'ret' }],
    outTask: { in: ['bar'] },
    locals: { }
  };
  t.deepEqual(validate(ast), []);  
  t.end();
});

test('param obj exist func str needs map to fn in locals or in params', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [{ f: 'a.b', in: [], out: ['bar'], type: 'ret' }],
    outTask: { in: ['bar'] },
    locals: { }
  };
  t.deepEqual(validate(ast), []);  
  t.end();
});

test('param obj !exist func str needs map to fn in locals or in params', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [{ f: 'd.e', in: [], out: ['bar'], type: 'ret' }],
    outTask: { in: ['bar'] },
    locals: { }
  };
  t.deepEqual(validate(ast), []);  
  t.end();
});

test('multiple tasks output the same param, must be unique', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [
      { f: foo, in: [], out: ['baz', 'c'] },
      { f: bar, in: [], out: ['c'] }
    ], 
    outTask: { in: ['bar'] }
  };
  var msg = 'multiple tasks output the same param, must be unique. param: c';
  t.deepEqual(validate(ast), [msg]);  
  t.end();
});