'use strict';

var test = require('tap').test;

var tutil = require('../lib/task.js');

function foo() { }
function bar() { }

test('missing types are guessed from params', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [
      { f: foo, a: ['a'], out: ['baz'] },
    ],
    outTask: { a: ['baz'] }
  };
  tutil.setMissingType(ast.tasks[0]);
  t.equal(ast.tasks[0].type, 'cb');
  t.end();
});
