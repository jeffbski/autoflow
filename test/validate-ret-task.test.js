'use strict';

var test = require('tap').test;
var util = require('util');
var sprintf = require('sprintf').sprintf;

var validate = require('../lib/validate.js');

function foo() { }


test('retTask requires f, in, out', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [{ type: 'ret' }],
    outTask: { in: ['bar'] }
  };
  var msg = sprintf('retTask requires f, in, out - %s',
                    util.inspect(ast.tasks[0]));
  t.deepEqual(validate(ast), [msg]);  
  t.end();
});
  
test('retTask verifies f type', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [{ type: 'ret', f: foo, in: [], out: ['bar'] }],
    outTask: { in: ['bar'] }
  };
  ast.tasks[0].f = 123; //err should be fn or string
  var msg = sprintf('retTask requires f to be a function or string - %s',
                    util.inspect(ast.tasks[0]));
  t.deepEqual(validate(ast), [msg]);
  t.end();
});

test('retTask verifies in type', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [{ type: 'ret', f: foo, in: [], out: ['bar'] }],
    outTask: { in: ['bar'] }
  };
  ast.tasks[0].in = 'foo'; //err should be arr of strings
  var msg = sprintf('retTask requires in to be an array of string param names - %s',
                    util.inspect(ast.tasks[0]));
  t.deepEqual(validate(ast), [msg]);  

  ast = Object.create(ast);
  ast.tasks[0].in = ['foo', 1]; //err should be arr of strings
  msg = sprintf('retTask requires in to be an array of string param names - %s',
                    util.inspect(ast.tasks[0]));
  t.deepEqual(validate(ast), [msg]);  
  t.end();
});

test('retTask verifies out type', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [{ type: 'ret', f: foo, in: [], out: ['bar'] }],
    outTask: { in: ['bar'] }
  };
  ast.tasks[0].out = 'foo'; //err should be array with single string or []
  var msg = sprintf('retTask requires out to be an array with single string param name or [] - %s',
                    util.inspect(ast.tasks[0]));
  t.deepEqual(validate(ast), [msg]);  

  ast = Object.create(ast);
  ast.tasks[0].out = 123; //err should be array with single string or []
  msg = sprintf('retTask requires out to be an array with single string param name or [] - %s',
                    util.inspect(ast.tasks[0]));
  t.deepEqual(validate(ast), [msg]);  
  t.end();
});

test('valid retTask', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [{ type: 'ret', f: foo, in: [], out: ['bar'] }],
    outTask: { in: ['bar'] }
  };
  t.deepEqual(validate(ast), []);  
  t.end();
});