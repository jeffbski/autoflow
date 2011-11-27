'use strict';

var test = require('tap').test;

var FinalCbTask = require('../lib/finalcb-task.js');

test('undefined cb throws exception', function (t) {
  var fn = function () {
    var finalTask = FinalCbTask.create({}, undefined);
  };
  t.throws(fn, new Error('callback is not a function'));
  t.end();
});

test('null cb  throws exception', function (t) {
  var fn = function () {
    var finalTask = FinalCbTask.create({}, null);
  };
  t.throws(fn, new Error('callback is not a function'));
  t.end();
});

test('cb needs to be a function or throws exception', function (t) {
  var fn = function () {
    var finalTask = FinalCbTask.create({}, 'foo');
  };
  t.throws(fn, new Error('callback is not a function'));
  t.end();
});

test('valid fn creates outTask', function (t) {
  function foo() { }
  var finalTask = FinalCbTask.create({ a: ['bar', 'baz']}, foo);
  t.equal(finalTask.f, foo);
  t.deepEqual(finalTask.a, ['bar', 'baz']);
  t.end();
});