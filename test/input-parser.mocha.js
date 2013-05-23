/*global react:true inputParser:true */

if (typeof(chai) === 'undefined') {
  var chai = require('chai');
}

if (typeof(react) === 'undefined') {
  var react = require('../'); //require('react');
}

if (typeof(inputParser) === 'undefined') {
  var inputParser = require('../lib/input-parser.js');
}

(function () {
  'use strict';

  var t = chai.assert;

  /**
     Testing ...
  */

  suite('input-parser');

  test('parser parses input args', function (done) {
    function myCb() { }
    var ast = { inParams: ['a', 'b'] };
    var parsedInput = inputParser([10, 20, myCb], ast);
    t.deepEqual(parsedInput.args, [10, 20]);
    t.deepEqual(parsedInput.options, inputParser.defaultExecOptions);
    done();
  });

  test('parser parses input args with cb', function (done) {
    function foo() { }
    var ast = { inParams: ['a', 'b'] };
    var parsedInput = inputParser([10, 20, foo], ast);
    t.deepEqual(parsedInput.args, [10, 20]);
    t.deepEqual(parsedInput.cb, foo);
    t.deepEqual(parsedInput.options, inputParser.defaultExecOptions);
    done();
  });

  test('parser parses input args with cb and extra args', function (done) {
    function foo() { }
    var ast = { inParams: ['a', 'b'] };
    var parsedInput = inputParser([10, 20, foo, 30, 40], ast);
    t.deepEqual(parsedInput.args, [10, 20]);
    t.deepEqual(parsedInput.cb, foo);
    t.deepEqual(parsedInput.extraArgs, [30, 40]);
    t.deepEqual(parsedInput.options, inputParser.defaultExecOptions);
    done();
  });

  test('parser parses input args with extra args', function (done) {
    var ast = { inParams: [] };
    var execOptions = { reactExecOptions: true, outputStyle: 'none' };
    var parsedInput = inputParser([execOptions, 10, 20], ast);
    t.deepEqual(parsedInput.args, []);
    t.deepEqual(parsedInput.extraArgs, [10, 20]);
    done();
  });

  test('parser pulls react exec option off arg list', function (done) {
    function myCb() { }
    var ast = { inParams: ['a', 'b'] };
    var execOptions = { reactExecOptions: true, foo: 10 };
    var parsedInput = inputParser([execOptions, 10, 20, myCb], ast);
    t.deepEqual(parsedInput.args, [10, 20]);
    t.deepEqual(parsedInput.options, { reactExecOptions: true, outputStyle: 'cb', foo: 10 });
    done();
  });

  test('parser pulls react exec options off arg list and merges from left to right', function (done) {
    function myCb() { }
    var ast = { inParams: ['a', 'b'] };
    var execOptions = { reactExecOptions: true, foo: 12, bar: 24 };
    var execOptions2 = { reactExecOptions: true, bar: 36, baz: 'hello' };
    var parsedInput = inputParser([execOptions, execOptions2, 10, 20, myCb], ast);
    t.deepEqual(parsedInput.args, [10, 20]);
    t.deepEqual(parsedInput.options, { reactExecOptions: true, outputStyle: 'cb', foo: 12, bar: 36, baz: 'hello' });
    done();
  });

}());