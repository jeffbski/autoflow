'use strict';

var test = require('tap').test;

var EventManager = require('../lib/event-manager.js');

test('Event Manager is disabled by default', function (t) {
  var em = EventManager.create();
  t.notOk(em.isEnabled(), 'should be falsey by default');
  t.end();
});

test('Event Manager enabled when a listener if registered', function (t) {
  var em = EventManager.create();
  em.on('foo', function () { });
  t.ok(em.isEnabled(), 'should be truthy');
  t.end();
});

test('Event Manager emits events', function (t) {
  t.plan(1);
  var em = EventManager.create();
  em.on('foo', function (data) {
    t.equal(data, 'hello');
    t.end();
  });
  em.emit('foo', 'hello');
});

test('Event Manager emits events, wildcarded listener', function (t) {
  t.plan(1);
  var em = EventManager.create();
  em.on('foo.*', function (data) {
    t.equal(data, 'hello-world');
    t.end();
  });
  em.emit('foo.bar', 'hello-world');
});

test('Event Manager emits events, all wildcarded listener', function (t) {
  t.plan(1);
  var em = EventManager.create();
  em.on('*', function (data) {
    t.equal(data, 'hello-world');
    t.end();
  });
  em.emit('foo.bar', 'hello-world');
});

test('Event Manager emits event with three args', function (t) {
  t.plan(3);
  var em = EventManager.create();
  em.on('foo', function (data, data2, data3) {
    t.equal(data, 'hello');
    t.equal(data2, 'world');
    t.equal(data3, 100);
    t.end();
  });
  em.emit('foo', 'hello', 'world', 100);
});

test('Event Manager with a parentListener will receive events', function (t) {
  t.plan(1);
  var parentEm = EventManager.create();
  var em = EventManager.create();
  em.parent = parentEm;
  parentEm.on('foo', function (data) {
    t.equal(data, 'world');
    t.end();
  });
  em.emit('foo', 'world');
});

test('Event Manager w/listening grandparent will receive events', function (t) {
  t.plan(1);
  var grandEm = EventManager.create();
  var parentEm = EventManager.create();
  parentEm.parent = grandEm;
  var em = EventManager.create();
  em.parent = parentEm;
  grandEm.on('foo', function (data) {
    t.equal(data, 'world');
    t.end();
  });
  em.emit('foo', 'world');
});

test('Event Manager all parents w/listeners will receive events', function (t) {
  t.plan(3);
  var grandEm = EventManager.create();
  var parentEm = EventManager.create();
  parentEm.parent = grandEm;
  var em = EventManager.create();
  em.parent = parentEm;
  function recData(data) {
    t.equal(data, 'hello');
  }
  grandEm.on('bar', recData);
  parentEm.on('bar', recData);
  em.on('bar', recData);
  em.emit('bar', 'hello');
});