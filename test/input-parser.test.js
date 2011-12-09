'use strict';

var test = require('tap').test;

var inputParser = require('../lib/input-parser.js');

test('parser parses input args', function (t) {
  var ast = { inParams: ['a', 'b'] };
  var parsedInput = inputParser([10, 20], ast);
  t.deepEqual(parsedInput.args, [10, 20]);
  t.deepEqual(parsedInput.options, inputParser.defaultExecOptions);
  t.end();
});

test('parser parses input args with cb', function (t) {
  function foo() { }
  var ast = { inParams: ['a', 'b'] };
  var parsedInput = inputParser([10, 20, foo], ast);
  t.deepEqual(parsedInput.args, [10, 20]);
  t.deepEqual(parsedInput.cb, foo);
  t.deepEqual(parsedInput.options, inputParser.defaultExecOptions);
  t.end();
});

test('parser parses input args with cb and extra args', function (t) {
  function foo() { }
  var ast = { inParams: ['a', 'b'] };
  var parsedInput = inputParser([10, 20, foo, 30, 40], ast);
  t.deepEqual(parsedInput.args, [10, 20]);
  t.deepEqual(parsedInput.cb, foo);
  t.deepEqual(parsedInput.extraArgs, [30, 40]);
  t.deepEqual(parsedInput.options, inputParser.defaultExecOptions);
  t.end();
});

test('parser parses input args with extra args', function (t) {
  var ast = { inParams: [] };
  var execOptions = { reactExecOptions: true, outputStyle: 'none' };
  var parsedInput = inputParser([execOptions, 10, 20], ast);
  t.deepEqual(parsedInput.args, []);
  t.deepEqual(parsedInput.extraArgs, [10, 20]);
  t.end();
});

test('parser pulls react exec option off arg list', function (t) {
  var ast = { inParams: ['a', 'b'] };
  var execOptions = { reactExecOptions: true, foo: 10 };
  var parsedInput = inputParser([execOptions, 10, 20], ast);
  t.deepEqual(parsedInput.args, [10, 20]);
  t.deepEqual(parsedInput.options, { reactExecOptions: true, outputStyle: 'callback', foo: 10 });
  t.end();
});

test('parser pulls react exec options off arg list and merges from left to right', function (t) {
  var ast = { inParams: ['a', 'b'] };
  var execOptions = { reactExecOptions: true, foo: 12, bar: 24 };
  var execOptions2 = { reactExecOptions: true, bar: 36, baz: 'hello' };
  var parsedInput = inputParser([execOptions, execOptions2, 10, 20], ast);
  t.deepEqual(parsedInput.args, [10, 20]);
  t.deepEqual(parsedInput.options, { reactExecOptions: true, outputStyle: 'callback', foo: 12, bar: 36, baz: 'hello' });
  t.end();
});