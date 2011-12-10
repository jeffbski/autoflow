'use strict';

var test = require('tap').test;
var sprintf = require('sprintf').sprintf;

var fstr = require('../lib/fstr.js');

function falpha() { }
function fbeta() { }

test('module exports an object', function (t) {
  t.type(fstr, 'function', 'has define by DSL method');
  t.end();
});

test('no arguments -> empty inParams, tasks, outTask', function (t) {
  var r = fstr();
  t.deepEqual(r.ast.inParams, []);
  t.deepEqual(r.ast.tasks, []);
  t.deepEqual(r.ast.outTask, { a: [], type: 'finalcb' });
  t.end();
});

test('empty first string -> empty inParams, tasks, outTask', function (t) {
  var r = fstr('');
  t.deepEqual(r.ast.inParams, []);
  t.deepEqual(r.ast.tasks, []);
  t.deepEqual(r.ast.outTask, { a: [], type: 'finalcb' });
  t.end();
});


test('single first string -> inParams["foo"], empty tasks, outTask', function (t) {
  var r = fstr('foo');
  t.deepEqual(r.ast.inParams, ['foo']);
  t.deepEqual(r.ast.tasks, []);
  t.deepEqual(r.ast.outTask, { a: [], type: 'finalcb' });
  t.end();
});

test('triple first string -> inParams["foo", "bar", "baz"], empty tasks, outTask',
     function (t) {
  var r = fstr(' foo,   bar,baz  ');
  t.deepEqual(r.ast.inParams, ['foo', 'bar', 'baz']);
  t.deepEqual(r.ast.tasks, []);
  t.deepEqual(r.ast.outTask, { a: [], type: 'finalcb' });
  t.end();
});

test('single task, single out params', function (t) {
  var r = fstr('', [
    falpha, 'a, b -> err, c'
  ], 'c');
  t.deepEqual(r.ast.inParams, []);
  t.deepEqual(r.ast.tasks, [
    { f: falpha, a: ['a', 'b'], cb: ['c'], type: 'cb', name: 'falpha'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c'], type: 'finalcb' });
  t.end();  
});

test('single task, err and out params', function (t) {
  var r = fstr('', [
    falpha, 'a, b -> err, c'
  ], 'err, c');
  t.deepEqual(r.ast.inParams, []);
  t.deepEqual(r.ast.tasks, [
    { f: falpha, a: ['a', 'b'], cb: ['c'], type: 'cb', name: 'falpha'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c'], type: 'finalcb' });
  t.end();  
});

test('single task, ERR and out params', function (t) {
  var r = fstr('', [
    falpha, 'a, b -> ERR, c'
  ], 'ERR, c');
  t.deepEqual(r.ast.inParams, []);
  t.deepEqual(r.ast.tasks, [
    { f: falpha, a: ['a', 'b'], cb: ['c'], type: 'cb', name: 'falpha'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c'], type: 'finalcb' });
  t.end();  
});

test('cb used in defs is simply ignored', function (t) {
  var r = fstr('a, b, cb', [
    falpha, 'a, b, cb -> err, c'
  ], 'err, c');
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: falpha, a: ['a', 'b'], cb: ['c'], type: 'cb', name: 'falpha'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c'], type: 'finalcb' });
  t.end();  
});

test('callback used in defs is simply ignored', function (t) {
  var r = fstr('a, b, callback', [
    falpha, 'a, b, callback -> err, c'
  ], 'err, c');
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: falpha, a: ['a', 'b'], cb: ['c'], type: 'cb', name: 'falpha'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c'], type: 'finalcb' });
  t.end();  
});

test('two inputs, two tasks, two out params', function (t) {
  var r = fstr('a, b', [
    falpha, 'a, b -> err, c',
    fbeta,  'a, b -> err, d, e'
  ], 'c, d');
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: falpha, a: ['a', 'b'], cb: ['c'], type: 'cb', name: 'falpha'},
    { f: fbeta,  a: ['a', 'b'], cb: ['d', 'e'], type: 'cb', name: 'fbeta'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
  t.end();  
});

test('two inputs, two mixed tasks, two out params', function (t) {
  var r = fstr('a, b', [
    falpha, 'a, b -> err, c',
    fbeta,  'a, b -> returns d'
  ], 'c, d');
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: falpha, a: ['a', 'b'], cb: ['c'], type: 'cb', name: 'falpha'},
    { f: fbeta,  a: ['a', 'b'], ret: 'd', type: 'ret', name: 'fbeta'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
  t.end();  
});

test('uses return', function (t) {
  var r = fstr('a, b', [
    falpha, 'a, b -> err, c',
    fbeta,  'a, b -> return d'
  ], 'c, d');
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: falpha, a: ['a', 'b'], cb: ['c'], type: 'cb', name: 'falpha'},
    { f: fbeta,  a: ['a', 'b'], ret: 'd', type: 'ret', name: 'fbeta'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
  t.end();  
});

test('uses Return', function (t) {
  var r = fstr('a, b', [
    falpha, 'a, b -> err, c',
    fbeta,  'a, b -> Return d'
  ], 'c, d');
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: falpha, a: ['a', 'b'], cb: ['c'], type: 'cb', name: 'falpha'},
    { f: fbeta,  a: ['a', 'b'], ret: 'd', type: 'ret', name: 'fbeta'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
  t.end();  
});

test('uses RETURN', function (t) {
  var r = fstr('a, b', [
    falpha, 'a, b -> err, c',
    fbeta,  'a, b -> RETURN d'
  ], 'c, d');
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: falpha, a: ['a', 'b'], cb: ['c'], type: 'cb', name: 'falpha'},
    { f: fbeta,  a: ['a', 'b'], ret: 'd', type: 'ret', name: 'fbeta'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
  t.end();  
});

test('uses RETURNS', function (t) {
  var r = fstr('a, b', [
    falpha, 'a, b -> err, c',
    fbeta,  'a, b -> RETURNS d'
  ], 'c, d');
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: falpha, a: ['a', 'b'], cb: ['c'], type: 'cb', name: 'falpha'},
    { f: fbeta,  a: ['a', 'b'], ret: 'd', type: 'ret', name: 'fbeta'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
  t.end();  
});

test('two inputs, two mixed tasks, two out params, opts', function (t) {
  var r = fstr('a, b', [
    falpha, 'a -> err, c', { after: fbeta },
    fbeta,  'a, b -> returns d'
  ], 'c, d');
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { after: fbeta, f: falpha, a: ['a'], cb: ['c'], type: 'cb', name: 'falpha'},
    { f: fbeta,  a: ['a', 'b'], ret: 'd', type: 'ret', name: 'fbeta'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
  t.end();  
});


// Object use
test('object prop task params', function (t) {
  var r = fstr('a, b', [
    falpha, 'a, b.cat -> err, c',
    fbeta,  'c.dog, b -> returns d',
    'd.egg', 'c -> e'
  ], 'c, e');
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: falpha, a: ['a', 'b.cat'], cb: ['c'], type: 'cb', name: 'falpha'},
    { f: fbeta,  a: ['c.dog', 'b'], ret: 'd', type: 'ret', name: 'fbeta'},
    { f: 'd.egg', a: ['c'], cb: ['e'], type: 'cb', name: 'd.egg'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'e'], type: 'finalcb' });
  t.end();  
});





test('extra arg throws error', function (t) {
  var fn = function () {
    var r = fstr('a, b', [
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
    var r = fstr('a, b', [
      falpha, 'a -> err, c', { after: fbeta },
      fbeta
    ], 'c, d');
  };
  t.throws(fn, new Error(sprintf('extra unmatched task arg: %s', fbeta)));
  t.end();  
});



/* selectFirst */

test('selectFirst', function (t) {
  var r = fstr.selectFirst('a, b', [
    falpha, 'a, b -> err, c',
    fbeta,  'a, b -> returns c'
  ], 'c');
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: falpha, a: ['a', 'b'], cb: ['c'], type: 'cb', name: 'falpha'},
    { f: fbeta,  a: ['a', 'b'], ret: 'c', type: 'ret', name: 'fbeta', after: ['falpha']}
  ]);
  t.deepEqual(r.ast.outTask, { type: 'finalcbFirst', a: ['c'] });
  t.end();  
});
