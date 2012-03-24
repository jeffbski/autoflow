'use strict';
/*global react:true tskutil:true */

if (typeof(chai) === 'undefined') {
  var chai = require('chai');
}

if (typeof(react) === 'undefined') {
  var react = require('../'); //require('react');
}

if (typeof(tskutil) === 'undefined') {
  var tskutil = require('../lib/task.js');  
}

(function () {

  var t = chai.assert;

  /**
     Testing final cb task
  */

  suite('finalcb-task');

  test('undefined cb throws exception', function (done) {
    var fn = function () {
      var finalTask = tskutil.createOutTask({}, undefined);
    };
    t.throws(fn, new Error('callback is not a function'));
    done();
  });

  test('null cb  throws exception', function (done) {
    var fn = function () {
      var finalTask = tskutil.createOutTask({}, null);
    };
    t.throws(fn, new Error('callback is not a function'));
    done();
  });

  test('cb needs to be a function or throws exception', function (done) {
    var fn = function () {
      var finalTask = tskutil.createOutTask({}, 'foo');
    };
    t.throws(fn, new Error('callback is not a function'));
    done();
  });

  test('valid fn creates outTask', function (done) {
    function foo() { }
    var finalTask = tskutil.createOutTask({ a: ['bar', 'baz']}, foo);
    t.equal(finalTask.f, foo);
    t.deepEqual(finalTask.a, ['bar', 'baz']);
    done();
  });

}());  