'use strict';
/*global react:true tutil:true */

if (typeof(chai) === 'undefined') {
  var chai = require('chai');
}

if (typeof(react) === 'undefined') {
  var react = require('../'); //require('react');
}

if (typeof(tutil) === 'undefined') {
  var tutil = require('../lib/task.js');
}

(function () {

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
    tutil.setMissingType(ast.tasks[0]);
    t.equal(ast.tasks[0].type, 'cb');
    done();
  });

}());  