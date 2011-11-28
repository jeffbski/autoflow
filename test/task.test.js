'use strict';

var test = require('tap').test;

var tutil = require('../lib/task.js');

function foo() { }
function bar() { }

test('missing types are guessed from params', function (t) {
  var ast = {
    inParams: ['a'], 
    tasks: [
      { f: foo, a: ['a'], cb: ['baz'] },
      { f: bar, a: ['baz'], ret: 'cat' },
    ],
    outTask: { a: ['cat'] }
  };
  tutil.setMissingType(ast.tasks[0]);
  tutil.setMissingType(ast.tasks[1]);
  t.equal(ast.tasks[0].type, 'cb');
  t.equal(ast.tasks[1].type, 'ret');
  t.end();
});
