'use strict';

var test = require('tap').test;
var sprintf = require('sprintf').sprintf;

var pcode = require('../lib/pcode.js');

function falpha() { }
function fbeta() { }
function fcharlie() { }

test('module exports an object', function (t) {
  t.type(pcode, 'function', 'has define by DSL method');
  t.end();
});

test('no arguments -> empty inParams, tasks, outTask', function (t) {
  var r = pcode();
  t.deepEqual(r.ast.inParams, []);
  t.deepEqual(r.ast.tasks, []);
  t.deepEqual(r.ast.outTask, { a: [], type: 'finalcb' });
  t.end();
});

test('empty first string -> empty inParams, tasks, outTask', function (t) {
  var r = pcode('');
  t.deepEqual(r.ast.inParams, []);
  t.deepEqual(r.ast.tasks, []);
  t.deepEqual(r.ast.outTask, { a: [], type: 'finalcb' });
  t.end();
});


test('single first string -> inParams["foo"], empty tasks, outTask', function (t) {
  var r = pcode('foo');
  t.deepEqual(r.ast.inParams, ['foo']);
  t.deepEqual(r.ast.tasks, []);
  t.deepEqual(r.ast.outTask, { a: [], type: 'finalcb' });
  t.end();
});

test('triple first string -> inParams["foo", "bar", "baz"], empty tasks, outTask',
     function (t) {
  var r = pcode(' foo,   bar,baz  ');
  t.deepEqual(r.ast.inParams, ['foo', 'bar', 'baz']);
  t.deepEqual(r.ast.tasks, []);
  t.deepEqual(r.ast.outTask, { a: [], type: 'finalcb' });
  t.end();
});

test('single task, single out params', function (t) {
  var locals = { falpha: falpha };
  var r = pcode('', [
    'c := falpha(a, b)',
    'cb(err, c)'
  ], locals);
  t.deepEqual(r.ast.inParams, []);
  t.deepEqual(r.ast.tasks, [
    { f: 'falpha', a: ['a', 'b'], out: ['c'], type: 'cb', name: 'falpha'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c'], type: 'finalcb' });
  t.end();  
});

test('single task, err and out params', function (t) {
  var locals = { falpha: falpha };
  var r = pcode('', [
    'c := falpha(a, b)',
    'cb(err, c)'
  ], locals);
  t.deepEqual(r.ast.inParams, []);
  t.deepEqual(r.ast.tasks, [
    { f: 'falpha', a: ['a', 'b'], out: ['c'], type: 'cb', name: 'falpha'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c'], type: 'finalcb' });
  t.end();  
});

test('two inputs, two tasks, two out params', function (t) {
  var locals = { falpha: falpha, fbeta: fbeta };
  var r = pcode('a, b', [
    'c := falpha(a, b)',
    'd, e := fbeta(a, b)',
    'cb(err, c, d)'
  ], locals);
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: 'falpha', a: ['a', 'b'], out: ['c'], type: 'cb', name: 'falpha'},
    { f: 'fbeta',  a: ['a', 'b'], out: ['d', 'e'], type: 'cb', name: 'fbeta'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
  t.end();  
});

test('two inputs, two tasks, two out params, options', function (t) {
  var locals = { falpha: falpha, fbeta: fbeta };
  var r = pcode('a, b', [
    'c := falpha(a, b)',
    'd, e := fbeta(a, b)',
    'cb(err, c, d)'
  ], locals, { name: 'myflow', otherOptFoo: 'foo'});
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: 'falpha', a: ['a', 'b'], out: ['c'], type: 'cb', name: 'falpha'},
    { f: 'fbeta',  a: ['a', 'b'], out: ['d', 'e'], type: 'cb', name: 'fbeta'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
  t.equal(r.ast.name, 'myflow', 'name should match if supplied');
  t.equal(r.ast.otherOptFoo, 'foo', 'other options should pass through');
  t.end();  
});



test('two inputs, two mixed tasks, two out params', function (t) {
  var locals = { falpha: falpha, fbeta: fbeta };
  var r = pcode('a, b', [
    'c := falpha(a, b)',
    'd = fbeta(a, b)',
    'cb(err, c, d)'
  ], locals);
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: 'falpha', a: ['a', 'b'], out: ['c'], type: 'cb', name: 'falpha'},
    { f: 'fbeta',  a: ['a', 'b'], out: ['d'], type: 'ret', name: 'fbeta'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
  t.end();  
});

test('allow cb in the definitions', function (t) {
  var locals = { falpha: falpha, fbeta: fbeta };
  var r = pcode('a, b, cb', [
    'c := falpha(a, b, cb)',
    'd = fbeta(a, b)',
    'cb(err, c, d)'
  ], locals);
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: 'falpha', a: ['a', 'b'], out: ['c'], type: 'cb', name: 'falpha'},
    { f: 'fbeta',  a: ['a', 'b'], out: ['d'], type: 'ret', name: 'fbeta'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
  t.end();  
});

test('allow Cb in the definitions', function (t) {
  var locals = { falpha: falpha, fbeta: fbeta };
  var r = pcode('a, b, Cb', [
    'c := falpha(a, b, Cb)',
    'd = fbeta(a, b)',
    'cb(err, c, d)'
  ], locals);
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: 'falpha', a: ['a', 'b'], out: ['c'], type: 'cb', name: 'falpha'},
    { f: 'fbeta',  a: ['a', 'b'], out: ['d'], type: 'ret', name: 'fbeta'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
  t.end();  
});

test('allow callback in the definitions', function (t) {
  var locals = { falpha: falpha, fbeta: fbeta };
  var r = pcode('a, b, callback', [
    'c := falpha(a, b, callback)',
    'd = fbeta(a, b)',
    'callback(err, c, d)'
  ], locals);
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: 'falpha', a: ['a', 'b'], out: ['c'], type: 'cb', name: 'falpha'},
    { f: 'fbeta',  a: ['a', 'b'], out: ['d'], type: 'ret', name: 'fbeta'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
  t.end();  
});

test('allow Callback in the definitions', function (t) {
  var locals = { falpha: falpha, fbeta: fbeta };
  var r = pcode('a, b, Callback', [
    'c := falpha(a, b, Callback)',
    'd = fbeta(a, b)',
    'Callback(err, c, d)'
  ], locals);
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: 'falpha', a: ['a', 'b'], out: ['c'], type: 'cb', name: 'falpha'},
    { f: 'fbeta',  a: ['a', 'b'], out: ['d'], type: 'ret', name: 'fbeta'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
  t.end();  
});





test('var prefix two inputs, two mixed tasks, two out params', function (t) {
  var locals = { falpha: falpha, fbeta: fbeta };
  var r = pcode('a, b', [
    'var c := falpha(a, b);',
    'var d = fbeta(a, b);',
    'cb(err, c, d);'
  ], locals);
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: 'falpha', a: ['a', 'b'], out: ['c'], type: 'cb', name: 'falpha'},
    { f: 'fbeta',  a: ['a', 'b'], out: ['d'], type: 'ret', name: 'fbeta'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
  t.end();  
});

test('when single ret fn:done', function (t) {
  var locals = { falpha: falpha, fbeta: fbeta };
  var r = pcode('a, b', [
    'c := falpha(a, b)',
    'd = fbeta(a, b) when falpha:done',
    'cb(err, c, d);'
  ], locals);
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: 'falpha', a: ['a', 'b'], out: ['c'], type: 'cb', name: 'falpha'},
    { f: 'fbeta',  a: ['a', 'b'], out: ['d'], type: 'ret', after: ['falpha'], name: 'fbeta'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
  t.end();  
});

test('when single cb fn:done', function (t) {
  var locals = { falpha: falpha, fbeta: fbeta };
  var r = pcode('a, b', [
    'c := falpha(a, b) when fbeta:done',
    'd = fbeta(a, b)',
    'cb(err, c, d);'
  ], locals);
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: 'falpha', a: ['a', 'b'], out: ['c'], type: 'cb', after: ['fbeta'], name: 'falpha'},
    { f: 'fbeta',  a: ['a', 'b'], out: ['d'], type: 'ret', name: 'fbeta'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
  t.end();  
});

test('when multiple fn:done cb', function (t) {
  var locals = { falpha: falpha, fbeta: fbeta, fcharlie: fcharlie };
  var r = pcode('a, b', [
    'd = fbeta(a, b)',
    'e = fcharlie(a, b)',
    'c := falpha(a, b) when fbeta:done and fcharlie:done',
    'cb(err, c, d);'
  ], locals);
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: 'fbeta',  a: ['a', 'b'], out: ['d'], type: 'ret', name: 'fbeta'},
    { f: 'fcharlie',  a: ['a', 'b'], out: ['e'], type: 'ret', name: 'fcharlie'},
    { f: 'falpha', a: ['a', 'b'], out: ['c'], type: 'cb', after: ['fbeta', 'fcharlie'], name: 'falpha'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
  t.end();  
});

test('when multiple fn:done ret', function (t) {
  var locals = { falpha: falpha, fbeta: fbeta, fcharlie: fcharlie };
  var r = pcode('a, b', [
    'd = fbeta(a, b)',
    'e = fcharlie(a, b)',
    'c = falpha(a, b) when fbeta:done and fcharlie:done',
    'cb(err, c, d);'
  ], locals);
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: 'fbeta',  a: ['a', 'b'], out: ['d'], type: 'ret', name: 'fbeta'},
    { f: 'fcharlie',  a: ['a', 'b'], out: ['e'], type: 'ret', name: 'fcharlie'},
    { f: 'falpha', a: ['a', 'b'], out: ['c'], type: 'ret', after: ['fbeta', 'fcharlie'], name: 'falpha'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
  t.end();  
});

test('when mixed multiple fn:done', function (t) {
  var locals = { falpha: falpha, fbeta: fbeta, fcharlie: fcharlie };
  var r = pcode('a, b', [
    'd = fbeta(a, b)',
    'e = fcharlie(a, b) when fbeta;',
    'c = falpha(a, b) when fbeta and fcharlie;',
    'cb(err, c, d);'
  ], locals);
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: 'fbeta',  a: ['a', 'b'], out: ['d'], type: 'ret', name: 'fbeta'},
    { f: 'fcharlie',  a: ['a', 'b'], out: ['e'], type: 'ret', after: ['fbeta'], name: 'fcharlie'},
    { f: 'falpha', a: ['a', 'b'], out: ['c'], type: 'ret', after: ['fbeta', 'fcharlie'], name: 'falpha'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
  t.end();  
});


/* selectFirst */

test('selectFirst', function (t) {
  var locals = { falpha: falpha, fbeta: fbeta, fcharlie: fcharlie };
  var r = pcode.selectFirst('a, b', [
    'c := falpha(a, b)',
    'c = fbeta(a, b)',
    'cb(err, c)'
  ], locals, { name: 'myflow', otherOptFoo: 'foo'});
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: 'falpha', a: ['a', 'b'], out: ['c'], type: 'cb', name: 'falpha'},
    { f: 'fbeta',  a: ['a', 'b'], out: ['c'], type: 'ret', name: 'fbeta', after: ['falpha']}
  ]);
  t.deepEqual(r.ast.outTask, { type: 'finalcbFirst', a: ['c'] });
  t.equal(r.ast.name, 'myflow', 'name should match if supplied');
  t.equal(r.ast.otherOptFoo, 'foo', 'other options should pass through');
  t.end();  
});

