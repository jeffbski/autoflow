'use strict';

var test = require('tap').test;
var util = require('util');
var sprintf = require('sprintf').sprintf;

var validate = require('../lib/validate.js');

function foo() { }

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
    tasks: [{ type: 'ret', f: foo, a: [], ret: 'bar' }],
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

test('each task in ast.tasks must match a task type', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [{ f: foo, a: [], ret: 'bar' }], //err missing type
    outTask: { a: ['bar'] }
  };
  var msg = sprintf('task.type should match one of cb, ret - %s',
                    util.inspect(ast.tasks[0]));
  t.deepEqual(validate(ast), [msg]);  

  ast.tasks = [{ type: 'zoo', f: foo, a: [], ret: 'bar' }];
  msg = sprintf('task.type should match one of cb, ret - %s',
                    util.inspect(ast.tasks[0]));
  t.deepEqual(validate(ast), [msg]);
  t.end();
});

test('ast.outTask.a should be an array of string param names', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [{ type: 'ret', f: foo, a: [], ret: 'bar' }], 
    outTask: { a: ['bar'] }
  };
  ast.outTask = {}; //err a should be an arr
  var msg = sprintf('ast.outTask.a should be an array of string param names - %s',
                    util.inspect(ast.outTask));
  t.deepEqual(validate(ast), [msg]);  

  ast.outTask = { a: 'bar' }; //err a should be an arr
  msg = sprintf('ast.outTask.a should be an array of string param names - %s',
                    util.inspect(ast.outTask));
  t.deepEqual(validate(ast), [msg]);  

  ast.outTask = { a: ['bar', 1] }; //err a should be an arr of strings
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
      { type: 'cb', f: foo, a: [], cb: ['bar'], name: 'dog' },
      { type: 'cb', f: foo, a: [], cb: ['bar'], name: 'dog' }
    ], 
    outTask: { a: ['bar'] }
  };
  var msg = sprintf('ast.tasks that specify name need to be unique, duplicate: %s',
                    'dog');
  t.deepEqual(validate(ast), [msg]);  
  t.end();
});
  
