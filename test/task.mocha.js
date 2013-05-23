/*global react:true taskUtil:true */

if (typeof(chai) === 'undefined') {
  var chai = require('chai');
}

if (typeof(react) === 'undefined') {
  var react = require('../'); //require('react');
}

if (typeof(taskUtil) === 'undefined') {
  var taskUtil = require('../lib/task.js');
}

(function () {
  'use strict';

  var t = chai.assert;

  /**
     Testing ...
  */

  suite('task');

  function foo() { }
  function bar() { }

  test('missing types are guessed from params', function (done) {
    var ast = {
      inParams: ['a'],
      tasks: [
        { f: foo, a: ['a'], out: ['baz'] },
      ],
      outTask: { a: ['baz'] }
    };
    taskUtil.setMissingType(ast.tasks[0]);
    t.equal(ast.tasks[0].type, 'cb');
    done();
  });

}());