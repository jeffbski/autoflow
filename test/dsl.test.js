'use strict';

var test = require('tap').test;
var sprintf = require('sprintf').sprintf;

var react = require('../'); // require('react');

function falpha() { }
function fbeta() { }

test('module exports is a fn with properties', function (t) {
  t.type(react, 'function', 'has define by DSL method'); //
  t.type(react.selectFirst, 'function', 'has selectFirst define method');
  t.end();
});

test('no arguments -> empty name, inParams, tasks, outTask', function (t) {
  var r = react();
  t.equal(r.ast.name, undefined);
  t.deepEqual(r.ast.inParams, []);
  t.deepEqual(r.ast.tasks, []);
  t.deepEqual(r.ast.outTask, { a: [], type: 'finalcb' });
  t.end();
});


test('empty first string -> empty name, inParams, tasks, outTask', function (t) {
  var r = react('');
  t.equal(r.ast.name, '');
  t.deepEqual(r.ast.inParams, []);
  t.deepEqual(r.ast.tasks, []);
  t.deepEqual(r.ast.outTask, { a: [], type: 'finalcb' });
  t.end();
});


test('single first string -> name, inParams["foo"], empty tasks, outTask', function (t) {
  var r = react('foo');
  t.equal(r.ast.name, 'foo');
  t.deepEqual(r.ast.inParams, []);
  t.deepEqual(r.ast.tasks, []);
  t.deepEqual(r.ast.outTask, { a: [], type: 'finalcb' });
  t.end();
});

test('triple first string -> inParams["foo", "bar", "baz"], empty tasks, outTask',
     function (t) {
  var r = react('myName', ' foo,   bar,baz  ');
  t.equal(r.ast.name, 'myName');
  t.deepEqual(r.ast.inParams, ['foo', 'bar', 'baz']);
  t.deepEqual(r.ast.tasks, []);
  t.deepEqual(r.ast.outTask, { a: [], type: 'finalcb' });
  t.end();
});

test('single task, single out params', function (t) {
  var r = react('myName', 'cb -> err, c',
    falpha, 'a, b, cb -> err, c'
  );
  t.deepEqual(r.ast.inParams, []);
  t.deepEqual(r.ast.tasks, [
    { f: falpha, a: ['a', 'b'], out: ['c'], type: 'cb', name: 'falpha'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c'], type: 'finalcb' });
  t.end();  
});

test('single task, err and out params', function (t) {
  var r = react('myName', 'cb -> err, c',
    falpha, 'a, b, cb -> err, c'
  );
  t.deepEqual(r.ast.inParams, []);
  t.deepEqual(r.ast.tasks, [
    { f: falpha, a: ['a', 'b'], out: ['c'], type: 'cb', name: 'falpha'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c'], type: 'finalcb' });
  t.end();  
});

test('single task, ERR and out params', function (t) {
  var r = react('myName', 'cb -> ERR, c', 
    falpha, 'a, b, cb -> ERR, c'
  );
  t.deepEqual(r.ast.inParams, []);
  t.deepEqual(r.ast.tasks, [
    { f: falpha, a: ['a', 'b'], out: ['c'], type: 'cb', name: 'falpha'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c'], type: 'finalcb' });
  t.end();  
});

test('cb used in defs is simply ignored', function (t) {
  var r = react('myName', 'a, b, cb -> err, c', 
    falpha, 'a, b, cb -> err, c'
  );
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: falpha, a: ['a', 'b'], out: ['c'], type: 'cb', name: 'falpha'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c'], type: 'finalcb' });
  t.end();  
});

test('callback used in defs is simply ignored', function (t) {
  var r = react('myName', 'a, b, callback -> err, c',
    falpha, 'a, b, callback -> err, c'
  );
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: falpha, a: ['a', 'b'], out: ['c'], type: 'cb', name: 'falpha'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c'], type: 'finalcb' });
  t.end();  
});

test('two inputs, two tasks, two out params', function (t) {
  var r = react('myName', 'a, b, cb -> err, c, d',
    falpha, 'a, b, cb -> err, c',
    fbeta,  'a, b, cb -> err, d, e'
  );
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: falpha, a: ['a', 'b'], out: ['c'], type: 'cb', name: 'falpha'},
    { f: fbeta,  a: ['a', 'b'], out: ['d', 'e'], type: 'cb', name: 'fbeta'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
  t.end();  
});

test('two inputs, two tasks, two out params, options', function (t) {
  var r = react('myName', 'a, b, cb -> err, c, d',
    falpha, 'a, b, cb -> err, c',
    fbeta,  'a, b, cb -> err, d, e',
    { name: 'myflow', otherOptFoo: 'foo'}
  );
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: falpha, a: ['a', 'b'], out: ['c'], type: 'cb', name: 'falpha'},
    { f: fbeta,  a: ['a', 'b'], out: ['d', 'e'], type: 'cb', name: 'fbeta'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
  t.equal(r.ast.name, 'myflow', 'name should match if supplied');
  t.equal(r.ast.otherOptFoo, 'foo', 'other options should pass through');
  t.end();  
});

test('two inputs, two mixed tasks, two out params', function (t) {
  var r = react('myName', 'a, b, cb -> err, c, d',
    falpha, 'a, b, cb -> err, c',
    fbeta,  'a, b -> d'
  );
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: falpha, a: ['a', 'b'], out: ['c'], type: 'cb', name: 'falpha'},
    { f: fbeta,  a: ['a', 'b'], out: ['d'], type: 'ret', name: 'fbeta'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
  t.end();  
});


test('two inputs, two mixed tasks, two out params, opts', function (t) {
  var r = react('myName', 'a, b, cb -> err, c, d', 
    falpha, 'a, cb -> err, c', { after: fbeta },
    fbeta,  'a, b -> d'
  );
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { after: ['fbeta'], f: falpha, a: ['a'], out: ['c'], type: 'cb', name: 'falpha'},
    { f: fbeta,  a: ['a', 'b'], out: ['d'], type: 'ret', name: 'fbeta'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
  t.end();  
});


// Object use
test('object prop task params', function (t) {
  var r = react('myName', 'a, b, cb -> err, c, e', 
    falpha, 'a, b.cat, cb -> err, c',
    fbeta,  'c.dog, b -> d',
    'd.egg', 'c, cb -> err, e'
  );
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: falpha, a: ['a', 'b.cat'], out: ['c'], type: 'cb', name: 'falpha'},
    { f: fbeta,  a: ['c.dog', 'b'], out: ['d'], type: 'ret', name: 'fbeta'},
    { f: 'd.egg', a: ['c'], out: ['e'], type: 'cb', name: 'd.egg'}
  ]);
  t.deepEqual(r.ast.outTask, { a: ['c', 'e'], type: 'finalcb' });
  t.end();  
});

test('extra arg throws error', function (t) {
  var fn = function () {
    var r = react('myName', 'a, b, cb -> err, c, d', 
      falpha, 'a -> err, c', { after: fbeta },
      fbeta,  'a, b -> returns d',
      'extraBadArg'
    );
  };
  t.throws(fn, new Error('extra unmatched task arg: extraBadArg'));
  t.end();  
});

test('not enough args throws error', function (t) {
  var fn = function () {
    var r = react('myName', 'a, b, cb -> c, d', 
      falpha, 'a -> err, c', { after: fbeta },
      fbeta
    );
  };
  t.throws(fn, new Error(sprintf('extra unmatched task arg: %s', fbeta)));
  t.end();  
});



// selectFirst 

test('selectFirst', function (t) {
  var r = react.selectFirst('myName', 'a, b, cb -> c',
    falpha, 'a, b, cb -> err, c',
    fbeta,  'a, b -> c',
    { otherOptFoo: 'foo'}
  );
  t.equal(r.ast.name, 'myName');
  t.deepEqual(r.ast.inParams, ['a', 'b']);
  t.deepEqual(r.ast.tasks, [
    { f: falpha, a: ['a', 'b'], out: ['c'], type: 'cb', name: 'falpha'},
    { f: fbeta,  a: ['a', 'b'], out: ['c'], type: 'ret', name: 'fbeta', after: ['falpha']}
  ]);
  t.deepEqual(r.ast.outTask, { type: 'finalcbFirst', a: ['c'] });
  t.equal(r.ast.name, 'myName', 'name should match if supplied');
  t.equal(r.ast.otherOptFoo, 'foo', 'other options should pass through');
  t.end();  
});
