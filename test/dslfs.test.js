'use strict';

var test = require('tap').test;

var dsl = require('../lib/dslfs.js');

test('module exports an object', function (t) {
  t.type(dsl, 'function', 'has define by DSL method');
  t.end();
});

test('no arguments -> empty inParams, tasks, outTask', function (t) {
  var r = dsl();
  t.deepEqual(r.ast.inParams, []);
  t.deepEqual(r.ast.tasks, []);
  t.deepEqual(r.ast.outTask, {});
  t.end();
});

test('empty first string -> empty inParams, tasks, outTask', function (t) {
  var r = dsl('');
  t.deepEqual(r.ast.inParams, []);
  t.deepEqual(r.ast.tasks, []);
  t.deepEqual(r.ast.outTask, {});
  t.end();
});

/*
test('single first string -> inParams["foo"], empty tasks, outTask', function (t) {
  var r = dsl('foo');
  t.deepEqual(r.ast.inParams, ['foo']);
  t.deepEqual(r.ast.tasks, []);
  t.deepEqual(r.ast.outTask, {});
  t.end();
});
*/