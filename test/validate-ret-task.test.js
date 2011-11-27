'use strict';

var test = require('tap').test;
var util = require('util');
var sprintf = require('sprintf').sprintf;

var validate = require('../lib/validate.js');

function foo() { }


test('retTask requires f, a, ret', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [{ type: 'ret' }],
    outTask: { a: ['bar'] }
  };
  var msg = sprintf('retTask requires f, a, ret - %s',
                    util.inspect(ast.tasks[0]));
  t.deepEqual(validate(ast), [msg]);  
  t.end();
});
  
test('retTask verifies f type', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [{ type: 'ret', f: foo, a: [], ret: 'bar' }],
    outTask: { a: ['bar'] }
  };
  ast.tasks[0].f = 123; //err should be fn or string
  var msg = sprintf('retTask requires f to be a function or string - %s',
                    util.inspect(ast.tasks[0]));
  t.deepEqual(validate(ast), [msg]);
  t.end();
});

test('retTask verifies a type', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [{ type: 'ret', f: foo, a: [], ret: 'bar' }],
    outTask: { a: ['bar'] }
  };
  ast.tasks[0].a = 'foo'; //err should be arr of strings
  var msg = sprintf('retTask requires a to be an array of string param names - %s',
                    util.inspect(ast.tasks[0]));
  t.deepEqual(validate(ast), [msg]);  

  ast = Object.create(ast);
  ast.tasks[0].a = ['foo', 1]; //err should be arr of strings
  msg = sprintf('retTask requires a to be an array of string param names - %s',
                    util.inspect(ast.tasks[0]));
  t.deepEqual(validate(ast), [msg]);  
  t.end();
});

test('retTask verifies ret type', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [{ type: 'ret', f: foo, a: [], ret: 'bar' }],
    outTask: { a: ['bar'] }
  };
  ast.tasks[0].ret = 123; //err should be string or null
  var msg = sprintf('retTask requires ret to be a string param name or null - %s',
                    util.inspect(ast.tasks[0]));
  t.deepEqual(validate(ast), [msg]);  

  ast = Object.create(ast);
  ast.tasks[0].ret = ['foo']; //err should be a string or null
  msg = sprintf('retTask requires ret to be a string param name or null - %s',
                    util.inspect(ast.tasks[0]));
  t.deepEqual(validate(ast), [msg]);  
  t.end();
});

test('valid retTask', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [{ type: 'ret', f: foo, a: [], ret: 'bar' }],
    outTask: { a: ['bar'] }
  };
  t.deepEqual(validate(ast), []);  
  t.end();
});