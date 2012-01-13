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
    tasks: [{ f: foo, a: [], out: ['bar'], type: 'ret' }],
    outTask: { a: ['bar'] }
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
    outTask: { a: ['bar'] }
  };
  t.deepEqual(validate(ast), ['ast.tasks must be an array of tasks']);
  t.end();
});

test('each task must be an object', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [1],  //err not array of objects
    outTask: { a: ['bar'] }
  };
  t.deepEqual(validate(ast), ['task must be an object - 1']);  
  t.end();
  
});


test('each task in ast.tasks must match a valid task type', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [{ type: 'zoo', f: foo, a: [], out: ['bar'] }], //err wrong type
    outTask: { a: ['bar'] }
  };
  var msg = sprintf('task.type should match one of %s - %s',
                    tutil.taskTypeKeys().join(', '), util.inspect(ast.tasks[0]));
  t.deepEqual(validate(ast), [msg]);
  t.end();
});

test('ast.outTask.a should be an array of string param names', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [{ f: foo, a: [], out: ['bar'], type: 'ret' }], 
    outTask: { a: ['bar'] }
  };
  ast.outTask = {}; //err a should be an arr
  var msg = sprintf('ast.outTask.a should be an array of string param names - %s',
                    util.inspect({ type: 'finalcb' }));
  t.deepEqual(validate(ast), [msg]);  

  ast.outTask = { type: 'finalcb', a: 'bar' }; //err a should be an arr
  msg = sprintf('ast.outTask.a should be an array of string param names - %s',
                    util.inspect(ast.outTask));
  t.deepEqual(validate(ast), [msg]);  

  ast.outTask = { type: 'finalcb', a: ['bar', 1] }; //err a should be an arr of strings
  msg = sprintf('ast.outTask.a should be an array of string param names - %s',
                    util.inspect(ast.outTask));
  t.deepEqual(validate(ast), [msg]);  

  ast.outTask = { a: [] }; //valid
  t.deepEqual(validate(ast), []);  
  t.end();
});

test('ast.tasks that specify name need to be unique', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [
      { f: foo, a: [], out: ['bar'], name: 'dog' },
      { f: foo, a: [], out: ['bar'], name: 'dog' }
    ], 
    outTask: { a: ['bar'] }
  };
  var msg = sprintf('ast.tasks that specify name need to be unique, duplicate: %s',
                    'dog');
  t.deepEqual(validate(ast), [msg]);  
  t.end();
});
  
test('ast.locals should be non-null if passed in', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [{ f: foo, a: [], out: ['bar'], type: 'ret' }],
    outTask: { a: ['bar'] },
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
    tasks: [{ f: 'foo', a: [], out: ['bar'], type: 'ret' }],
    outTask: { a: ['bar'] },
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
    tasks: [{ f: 'cat.bar', a: [], out: ['bar'], type: 'ret' }],
    outTask: { a: ['bar'] },
    locals: { cat: { bar: foo }}
  };
  t.deepEqual(validate(ast), []);  
  t.end();
});

test('string functions maps to fn in inputs', function (t) {
  var ast = {
    inParams: ['a1', 'dog'], 
    tasks: [{ f: 'dog.food', a: [], out: ['bar'], type: 'ret' }],
    outTask: { a: ['bar'] },
    locals: { }
  };
  t.deepEqual(validate(ast), []);  
  t.end();
});

test('string functions need to map to fn in locals or in params', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [{ f: 'foo.bar', a: [], out: ['bar'], type: 'ret' }],
    outTask: { a: ['bar'] },
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
    tasks: [{ f: 'a', a: [], out: ['bar'], type: 'ret' }],
    outTask: { a: ['bar'] },
    locals: { }
  };
  t.deepEqual(validate(ast), []);  
  t.end();
});

test('param obj exist func str needs map to fn in locals or in params', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [{ f: 'a.b', a: [], out: ['bar'], type: 'ret' }],
    outTask: { a: ['bar'] },
    locals: { }
  };
  t.deepEqual(validate(ast), []);  
  t.end();
});

test('param obj !exist func str needs map to fn in locals or in params', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [{ f: 'd.e', a: [], out: ['bar'], type: 'ret' }],
    outTask: { a: ['bar'] },
    locals: { }
  };
  t.deepEqual(validate(ast), []);  
  t.end();
});

test('multiple tasks output the same param, must be unique', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [
      { f: foo, a: [], out: ['baz', 'c'] },
      { f: bar, a: [], out: ['c'] }
    ], 
    outTask: { a: ['baz'] }
  };
  var msg = 'multiple tasks output the same param, must be unique. param: c';
  t.deepEqual(validate(ast), [msg]);  
  t.end();
});

test('missing or mispelled input variable', function (t) {
  var ast = {
    inParams: [], 
    tasks: [
      { f: foo, a: [], out: [] },
      { f: bar, a: ['abc'], out: [] }
    ], 
    outTask: { a: [] }
  };
  var msg = 'missing or mispelled variable referenced in flow definition: abc';
  t.deepEqual(validate(ast), [msg]);  
  t.end();  
});

test('missing or mispelled input variables', function (t) {
  var ast = {
    inParams: ['aaa', 'bbb'], 
    tasks: [
      { f: foo, a: ['aaa', 'cat'], out: ['ccc'] },
      { f: bar, a: ['abc', 'bbb', 'ccc'], out: [] }
    ], 
    outTask: { a: [] }
  };
  var messages = [
    'missing or mispelled variable referenced in flow definition: cat',
    'missing or mispelled variable referenced in flow definition: abc'
  ];
  t.deepEqual(validate(ast), messages);  
  t.end();  
});

test('missing or mispelled final output variables', function (t) {
  var ast = {
    inParams: ['aaa'], 
    tasks: [
      { f: foo, a: ['aaa'], out: ['bbb'] },
      { f: bar, a: ['bbb'], out: ['ccc'] }
    ], 
    outTask: { a: ['ccc', 'ddd', 'eee'] }
  };
  var messages = [
    'missing or mispelled variable referenced in flow definition: ddd',
    'missing or mispelled variable referenced in flow definition: eee'
  ];
  t.deepEqual(validate(ast), messages);  
  t.end();  
});

test('missing or mispelled validation ignores properties', function (t) {
  var ast = {
    inParams: ['obj'], 
    tasks: [
      { f: foo, a: ['obj.foo'], out: [] },
      { f: bar, a: ['obj.bar'], out: [] }
    ], 
    outTask: { a: ['obj.cat'] }
  };
  t.deepEqual(validate(ast), []);  
  t.end();  
});

test('missing or mispelled validation ignores literals', function (t) {
  var ast = {
    inParams: [], 
    tasks: [
      { f: foo, a: ['true', 'false', '123', '123.1', 'null'], out: [] },
      { f: bar, a: ['-123', '-123.4', '"wow"', "'hey'"], out: [] }
    ], 
    outTask: { a: [] }
  };
  t.deepEqual(validate(ast), []);  
  t.end();  
});

