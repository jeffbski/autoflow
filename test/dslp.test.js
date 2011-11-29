'use strict';

var test = require('tap').test;
var sprintf = require('sprintf').sprintf;

var dslp = require('../lib/dslp.js');

function falpha() { }
function fbeta() { }

test('module exports an object', function (t) {
  t.type(dslp, 'function', 'has define by DSL method');
  t.end();
});

test('no arguments -> empty inParams, tasks, outTask', function (t) {
  var r = dslp();
  t.deepEqual(r.ast.inParams, []);
  t.deepEqual(r.ast.tasks, []);
  t.deepEqual(r.ast.outTask, { a: [] });
  t.end();
});

test('empty first string -> empty inParams, tasks, outTask', function (t) {
  var r = dslp('');
  t.deepEqual(r.ast.inParams, []);
  t.deepEqual(r.ast.tasks, []);
  t.deepEqual(r.ast.outTask, { a: [] });
  t.end();
});


test('single first string -> inParams["foo"], empty tasks, outTask', function (t) {
  var r = dslp('foo');
  t.deepEqual(r.ast.inParams, ['foo']);
  t.deepEqual(r.ast.tasks, []);
  t.deepEqual(r.ast.outTask, { a: [] });
  t.end();
});

test('triple first string -> inParams["foo", "bar", "baz"], empty tasks, outTask',
     function (t) {
  var r = dslp(' foo,   bar,baz  ');
  t.deepEqual(r.ast.inParams, ['foo', 'bar', 'baz']);
  t.deepEqual(r.ast.tasks, []);
  t.deepEqual(r.ast.outTask, { a: [] });
  t.end();
});

test('single task, single out params', function (t) {
  var locals = { falpha: falpha };
  var r = dslp('', [
    'c := falpha(a, b)',
    'cb(err, c)'
  ], locals);
  t.deepEqual(r.ast.inParams, []);
  t.deepEqual(r.ast.tasks, [
    { f: 'falpha', a: ['a', 'b'], cb: ['c'], type: 'cb', name: 'falpha'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c'] });
  t.end();  
});

test('single task, err and out params', function (t) {
  var locals = { falpha: falpha };
  var r = dslp('', [
    'c := falpha(a, b)',
    'cb(err, c)'
  ], locals);
  t.deepEqual(r.ast.inParams, []);
  t.deepEqual(r.ast.tasks, [
    { f: 'falpha', a: ['a', 'b'], cb: ['c'], type: 'cb', name: 'falpha'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c'] });
  t.end();  
});

test('two inputs, two tasks, two out params', function (t) {
  var locals = { falpha: falpha, fbeta: fbeta };
  var r = dslp('a, b', [
    'c := falpha(a, b)',
    'd, e := fbeta(a, b)',
    'cb(err, c, d)'
  ], locals);
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: 'falpha', a: ['a', 'b'], cb: ['c'], type: 'cb', name: 'falpha'},
    { f: 'fbeta',  a: ['a', 'b'], cb: ['d', 'e'], type: 'cb', name: 'fbeta'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'] });
  t.end();  
});

test('two inputs, two mixed tasks, two out params', function (t) {
  var locals = { falpha: falpha, fbeta: fbeta };
  var r = dslp('a, b', [
    'c := falpha(a, b)',
    'd = fbeta(a, b)',
    'cb(err, c, d)'
  ], locals);
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: 'falpha', a: ['a', 'b'], cb: ['c'], type: 'cb', name: 'falpha'},
    { f: 'fbeta',  a: ['a', 'b'], ret: 'd', type: 'ret', name: 'fbeta'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'] });
  t.end();  
});

test('var prefix two inputs, two mixed tasks, two out params', function (t) {
  var locals = { falpha: falpha, fbeta: fbeta };
  var r = dslp('a, b', [
    'var c := falpha(a, b);',
    'var d = fbeta(a, b);',
    'cb(err, c, d);'
  ], locals);
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: 'falpha', a: ['a', 'b'], cb: ['c'], type: 'cb', name: 'falpha'},
    { f: 'fbeta',  a: ['a', 'b'], ret: 'd', type: 'ret', name: 'fbeta'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'] });
  t.end();  
});

