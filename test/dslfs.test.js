'use strict';

var test = require('tap').test;
var sprintf = require('sprintf').sprintf;

var dslfs = require('../lib/dslfs.js');

function falpha() { }
function fbeta() { }

test('module exports an object', function (t) {
  t.type(dslfs, 'function', 'has define by DSL method');
  t.end();
});

test('no arguments -> empty inParams, tasks, outTask', function (t) {
  var r = dslfs();
  t.deepEqual(r.ast.inParams, []);
  t.deepEqual(r.ast.tasks, []);
  t.deepEqual(r.ast.outTask, { a: [] });
  t.end();
});

test('empty first string -> empty inParams, tasks, outTask', function (t) {
  var r = dslfs('');
  t.deepEqual(r.ast.inParams, []);
  t.deepEqual(r.ast.tasks, []);
  t.deepEqual(r.ast.outTask, { a: [] });
  t.end();
});


test('single first string -> inParams["foo"], empty tasks, outTask', function (t) {
  var r = dslfs('foo');
  t.deepEqual(r.ast.inParams, ['foo']);
  t.deepEqual(r.ast.tasks, []);
  t.deepEqual(r.ast.outTask, { a: [] });
  t.end();
});

test('triple first string -> inParams["foo", "bar", "baz"], empty tasks, outTask',
     function (t) {
  var r = dslfs(' foo,   bar,baz  ');
  t.deepEqual(r.ast.inParams, ['foo', 'bar', 'baz']);
  t.deepEqual(r.ast.tasks, []);
  t.deepEqual(r.ast.outTask, { a: [] });
  t.end();
});

test('single task, single out params', function (t) {
  var r = dslfs('', [
    falpha, 'a, b -> err, c'
  ], 'c');
  t.deepEqual(r.ast.inParams, []);
  t.deepEqual(r.ast.tasks, [
    { f: falpha, a: ['a', 'b'], cb: ['c'], type: 'cb', name: 'falpha'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c'] });
  t.end();  
});

test('single task, err and out params', function (t) {
  var r = dslfs('', [
    falpha, 'a, b -> err, c'
  ], 'err, c');
  t.deepEqual(r.ast.inParams, []);
  t.deepEqual(r.ast.tasks, [
    { f: falpha, a: ['a', 'b'], cb: ['c'], type: 'cb', name: 'falpha'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c'] });
  t.end();  
});

test('two inputs, two tasks, two out params', function (t) {
  var r = dslfs('a, b', [
    falpha, 'a, b -> err, c',
    fbeta,  'a, b -> err, d, e'
  ], 'c, d');
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: falpha, a: ['a', 'b'], cb: ['c'], type: 'cb', name: 'falpha'},
    { f: fbeta,  a: ['a', 'b'], cb: ['d', 'e'], type: 'cb', name: 'fbeta'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'] });
  t.end();  
});

test('two inputs, two mixed tasks, two out params', function (t) {
  var r = dslfs('a, b', [
    falpha, 'a, b -> err, c',
    fbeta,  'a, b -> returns d'
  ], 'c, d');
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: falpha, a: ['a', 'b'], cb: ['c'], type: 'cb', name: 'falpha'},
    { f: fbeta,  a: ['a', 'b'], ret: 'd', type: 'ret', name: 'fbeta'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'] });
  t.end();  
});

test('two inputs, two mixed tasks, two out params, opts', function (t) {
  var r = dslfs('a, b', [
    falpha, 'a -> err, c', { after: fbeta },
    fbeta,  'a, b -> returns d'
  ], 'c, d');
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { after: fbeta, f: falpha, a: ['a'], cb: ['c'], type: 'cb', name: 'falpha'},
    { f: fbeta,  a: ['a', 'b'], ret: 'd', type: 'ret', name: 'fbeta'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'] });
  t.end();  
});

test('extra arg throws error', function (t) {
  var fn = function () {
    var r = dslfs('a, b', [
      falpha, 'a -> err, c', { after: fbeta },
      fbeta,  'a, b -> returns d',
      'extraBadArg'
    ], 'c, d');
  };
  t.throws(fn, new Error('extra unmatched task arg: extraBadArg'));
  t.end();  
});

test('not enough args throws error', function (t) {
  var fn = function () {
    var r = dslfs('a, b', [
      falpha, 'a -> err, c', { after: fbeta },
      fbeta
    ], 'c, d');
  };
  t.throws(fn, new Error(sprintf('extra unmatched task arg: %s', fbeta)));
  t.end();  
});