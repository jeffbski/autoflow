'use strict';

var test = require('tap').test;
var util = require('util');
var sprintf = require('sprintf').sprintf;

var validate = require('../lib/validate.js');

function foo() { }


test('cbTask requires f, a, out', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [{ type: 'cb' }],
    outTask: { a: ['bar'] }
  };
  var msg = sprintf('cbTask requires f, a, out - %s',
                    util.inspect(ast.tasks[0]));
  t.deepEqual(validate(ast), [msg]);  
  t.end();
});
  
test('cbTask verifies f type', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [{ type: 'cb', f: foo, a: [], out: [] }],
    outTask: { a: ['bar'] }
  };
  ast.tasks[0].f = 123; //err should be fn or string
  var msg = sprintf('cbTask requires f to be a function or string - %s',
                    util.inspect(ast.tasks[0]));
  t.deepEqual(validate(ast), [msg]);
  t.end();
});

test('cbTask verifies a type', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [{ type: 'cb', f: foo, a: [], out: [] }],
    outTask: { a: ['bar'] }
  };
  ast.tasks[0].a = 'foo'; //err should be arr of strings
  var msg = sprintf('cbTask requires a to be an array of string param names - %s',
                    util.inspect(ast.tasks[0]));
  t.deepEqual(validate(ast), [msg]);  

  ast = Object.create(ast);
  ast.tasks[0].a = ['foo', 1]; //err should be arr of strings
  msg = sprintf('cbTask requires a to be an array of string param names - %s',
                    util.inspect(ast.tasks[0]));
  t.deepEqual(validate(ast), [msg]);  
  t.end();
});

test('cbTask verifies out type', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [{ type: 'cb', f: foo, a: [], out: [] }],
    outTask: { a: ['bar'] }
  };
  ast.tasks[0].out = 'foo'; //err should be arr of strings
  var msg = sprintf('cbTask requires out to be an array of string param names - %s',
                    util.inspect(ast.tasks[0]));
  t.deepEqual(validate(ast), [msg]);  

  ast = Object.create(ast);
  ast.tasks[0].out = ['foo', 1]; //err should be arr of strings
  msg = sprintf('cbTask requires out to be an array of string param names - %s',
                    util.inspect(ast.tasks[0]));
  t.deepEqual(validate(ast), [msg]);  
  t.end();
});

