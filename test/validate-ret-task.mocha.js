/*global react:true util:true sprintf:true validate:true */

if (typeof(chai) === 'undefined') {
  var chai = require('chai');
}

if (typeof(react) === 'undefined') {
  var react = require('../'); //require('react');
}

if (typeof(util) === 'undefined') {
  var util = require('util');
}

if (typeof(sprintf) === 'undefined') {
  var sprintf = require('../lib/sprintf');
}

if (typeof(validate) === 'undefined') {
  var validate = require('../lib/validate.js');
}

(function () {
  'use strict';

  var t = chai.assert;

  /**
     Testing validation of return task
  */

  suite('validate-ret-task');

  function foo() { }


  test('retTask requires f, a, out', function (done) {
    var ast = {
      inParams: ['a'],
      tasks: [{ type: 'ret' }],
      outTask: { a: ['bar'] }
    };
    var msg = sprintf('retTask requires f, a, out - %s',
                      util.inspect(ast.tasks[0]));
    t.deepEqual(validate(ast), [msg]);
    done();
  });

  test('retTask verifies f type', function (done) {
    var ast = {
      inParams: ['a'],
      tasks: [{ type: 'ret', f: foo, a: [], out: ['bar'] }],
      outTask: { a: ['bar'] }
    };
    ast.tasks[0].f = 123; //err should be fn or string
    var msg = sprintf('retTask requires f to be a function or string - %s',
                      util.inspect(ast.tasks[0]));
    t.deepEqual(validate(ast), [msg]);
    done();
  });

  test('retTask verifies a type', function (done) {
    var ast = {
      inParams: ['a'],
      tasks: [{ type: 'ret', f: foo, a: [], out: ['bar'] }],
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
    done();
  });

  test('retTask verifies out type', function (done) {
    var ast = {
      inParams: ['a'],
      tasks: [{ type: 'ret', f: foo, a: [], out: ['bar'] }],
      outTask: { a: ['bar'] }
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
    done();
  });

  test('valid retTask', function (done) {
    var ast = {
      inParams: ['a'],
      tasks: [{ type: 'ret', f: foo, a: [], out: ['bar'] }],
      outTask: { a: ['bar'] }
    };
    t.deepEqual(validate(ast), []);
    done();
  });

}());