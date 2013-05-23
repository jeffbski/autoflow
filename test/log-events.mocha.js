/*global react:true BaseTask:true */

if (typeof(chai) === 'undefined') {
  var chai = require('chai');
}

if (typeof(react) === 'undefined') {
  var react = require('../'); //require('react');
}

(function () {
  'use strict';

  var t = chai.assert;

  /**
     Testing turning on logging of events
  */

  suite('log-events');

  /**
     @example
     var react = require('react');
     react.logEvents(); // log to console
  */

  before(function () {
    react.logEvents();
  });

  after(function () {
    react.logEvents(false);
  });

  test('use react() default DSL from module', function (done) {
    function multiply(a, b, cb) { cb(null, a * b); }
    function add(a, b, cb) { cb(null, a + b); }
    var fn = react('multiplyAdd', 'a, b, cb -> err, m, s',
                   multiply, 'a, b, cb -> err, m',
                   add, 'm, a, cb -> err, s'
                  );


    fn(2, 3, function (err, m, s) {
      t.deepEqual(err, null, 'should not be any error');
      t.equal(m, 6);
      t.equal(s, 8);
      done();
    });
  });

  test('use react.selectFirst() default DSL with events', function (done) {
    function noSuccess(a, b, cb) {
      setTimeout(function () { cb(null); }, 100); // returns undefined result
    }
    function noSuccessNull(a, b, cb) { cb(null, null); } // returns null result
    function add(a, b, cb) { cb(null, a + b); }


    var fn = react.selectFirst('mySelectFirst', 'a, b, cb -> err, c',
                               noSuccess, 'a, b, cb -> err, c',
                               noSuccessNull, 'a, b, cb -> err, c',
                               add, 'a, b, cb -> err, c',
                               noSuccess, 'a, b, cb -> err, c'
                              );

    var collector = react.createEventCollector();
    collector.capture(fn, 'task.complete');

    fn(2, 3, function (err, c) {
      t.deepEqual(err, null, 'should not be any error');
      t.equal(c, 5);
      var events = collector.list();
      t.equal(events.length, 3, 'should have seen two task compl events');
      t.equal(events[0].task.name, 'noSuccess', 'name matches');
      t.equal(events[1].task.name, 'noSuccessNull', 'name matches');
      t.equal(events[2].task.name, 'add', 'name matches');
      t.deepEqual(events[2].task.results, [5], 'results match');
      done();
    });
  });

}());




