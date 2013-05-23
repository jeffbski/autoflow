/*global react:true EventManager:true */

if (typeof(chai) === 'undefined') {
  var chai = require('chai');
}

if (typeof(react) === 'undefined') {
  var react = require('../'); //require('react');
}

if (typeof(EventManager) === 'undefined') {
  var EventManager = require('../lib/event-manager.js');
}

(function () {
  'use strict';

  var t = chai.assert;

  /**
     Testing EventManager
  */

  suite('event-manager');

  test('Event Manager is disabled by default', function (done) {
    var em = EventManager.create();
    t.isFalse(em.isEnabled(), 'should be falsey by default');
    done();
  });

  test('Event Manager enabled when a listener if registered', function (done) {
    var em = EventManager.create();
    em.on('foo', function () { });
    t.isTrue(em.isEnabled(), 'should be truthy');
    done();
  });

  test('Event Manager emits events', function (done) {
    var em = EventManager.create();
    em.on('foo', function (data) {
      t.equal(data, 'hello');
      done();
    });
    em.emit('foo', 'hello');
  });

  test('Event Manager emits events, wildcarded listener', function (done) {
    var em = EventManager.create();
    em.on('foo.*', function (data) {
      t.equal(data, 'hello-world');
      done();
    });
    em.emit('foo.bar', 'hello-world');
  });

  test('Event Manager emits events, all wildcarded listener', function (done) {
    var em = EventManager.create();
    em.on('*', function (data) {
      t.equal(data, 'hello-world');
      done();
    });
    em.emit('foo.bar', 'hello-world');
  });

  test('Event Manager emits event with three args', function (done) {
    var em = EventManager.create();
    em.on('foo', function (data, data2, data3) {
      t.equal(data, 'hello');
      t.equal(data2, 'world');
      t.equal(data3, 100);
      done();
    });
    em.emit('foo', 'hello', 'world', 100);
  });

  test('Event Manager with a parentListener will receive events', function (done) {
    var parentEm = EventManager.create();
    var em = EventManager.create();
    em.parent = parentEm;
    parentEm.on('foo', function (data) {
      t.equal(data, 'world');
      done();
    });
    em.emit('foo', 'world');
  });

  test('Event Manager w/listening grandparent will receive events', function (done) {
    var grandEm = EventManager.create();
    var parentEm = EventManager.create();
    parentEm.parent = grandEm;
    var em = EventManager.create();
    em.parent = parentEm;
    grandEm.on('foo', function (data) {
      t.equal(data, 'world');
      done();
    });
    em.emit('foo', 'world');
  });

  test('Event Manager all parents w/listeners will receive events', function (done) {
    var grandEm = EventManager.create();
    var parentEm = EventManager.create();
    parentEm.parent = grandEm;
    var em = EventManager.create();
    em.parent = parentEm;
    var expectedCalls = 2;
    function recData(data) {
      t.equal(data, 'hello');
      expectedCalls -= 1;
      if (!expectedCalls) done();
    }
    grandEm.on('bar', recData);
    parentEm.on('bar', recData);
    em.on('bar', recData);
    em.emit('bar', 'hello');
  });

}());