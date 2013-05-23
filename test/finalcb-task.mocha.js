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
     Testing final cb task
  */

  suite('finalcb-task');

  test('undefined cb throws exception', function (done) {
    var fn = function () {
      var finalTask = taskUtil.createOutTask({}, undefined);
    };
    t.throws(fn, 'callback is not a function');
    done();
  });

  test('null cb  throws exception', function (done) {
    var fn = function () {
      var finalTask = taskUtil.createOutTask({}, null);
    };
    t.throws(fn, 'callback is not a function');
    done();
  });

  test('cb needs to be a function or throws exception', function (done) {
    var fn = function () {
      var finalTask = taskUtil.createOutTask({}, 'foo');
    };
    t.throws(fn, 'callback is not a function');
    done();
  });

  test('valid fn creates outTask', function (done) {
    function foo() { }
    var finalTask = taskUtil.createOutTask({ a: ['bar', 'baz']}, foo);
    t.equal(finalTask.f, foo);
    t.deepEqual(finalTask.a, ['bar', 'baz']);
    done();
  });

}());