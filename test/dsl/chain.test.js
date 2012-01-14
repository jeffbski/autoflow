'use strict';

var test = require('tap').test;
var sprintf = require('sprintf').sprintf;

var chainDefine = require('../../dsl/chain'); // require('react/dsl/chain');

function falpha() { }
function fbeta() { }

test('module exports a function', function (t) {
  t.type(chainDefine, 'function', 'has define by chain method');
  t.type(chainDefine(), 'object', 'has define by chain method');
  t.type(chainDefine().selectFirst, 'function', 'has selectFirst def');
  t.type(chainDefine().in, 'function', 'has input param def');
  t.type(chainDefine().out, 'function', 'has output param def');
  t.type(chainDefine().async, 'function', 'has async - cb type task def');
  t.type(chainDefine().sync, 'function', 'has sync - ret type task def');
  t.type(chainDefine().after, 'function', 'has after prereq def');
  t.type(chainDefine().end, 'function', 'has end to complete flow and validate');
  t.end();
});

test('no arguments -> empty inParams, tasks, outTask', function (t) {
  var fn = chainDefine().end();
  t.deepEqual(fn.ast.inParams, []);
  t.deepEqual(fn.ast.tasks, []);
  t.deepEqual(fn.ast.outTask, { a: [], type: 'finalcb' });
  t.end();
});


test('in only -> inParams["foo"], empty tasks, outTask', function (t) {
  var fn = chainDefine()
    .in('foo')
    .end();
  t.deepEqual(fn.ast.inParams, ['foo']);
  t.deepEqual(fn.ast.tasks, []);
  t.deepEqual(fn.ast.outTask, { a: [], type: 'finalcb' });
  t.end();
});

test('in empty  -> inParams["foo"], empty tasks, outTask', function (t) {
  var fn = chainDefine()
    .in()
    .end();
  t.deepEqual(fn.ast.inParams, []);
  t.deepEqual(fn.ast.tasks, []);
  t.deepEqual(fn.ast.outTask, { a: [], type: 'finalcb' });
  t.end();
});


test('in triple first param -> inParams["foo", "bar", "baz"]', function (t) {
  var fn = chainDefine()
    .in('foo', 'bar', 'baz')
    .end();
  t.deepEqual(fn.ast.inParams, ['foo', 'bar', 'baz']);
  t.deepEqual(fn.ast.tasks, []);
  t.deepEqual(fn.ast.outTask, { a: [], type: 'finalcb' });
  t.end();
});

test('single task, single out params', function (t) {
  var fn = chainDefine()
    .in('a', 'b')
    .out('c')
    .async(falpha).in('a', 'b').out('c')
    .end();
  t.deepEqual(fn.ast.inParams, ['a', 'b']);
  t.deepEqual(fn.ast.tasks, [
    { f: falpha, type: 'cb', a: ['a', 'b'], out: ['c'], name: 'falpha' }
  ]);
  t.deepEqual(fn.ast.outTask, { a: ['c'], type: 'finalcb' });
  t.end();  
});

test('single task, err params', function (t) {
  var fn = chainDefine()
    .out('err')
    .async(falpha).in().out('err', 'c')
    .end();
  t.deepEqual(fn.ast.inParams, []);
  t.deepEqual(fn.ast.tasks, [
    { f: falpha, type: 'cb', a: [], out: ['c'], name: 'falpha' }
  ]);
  t.deepEqual(fn.ast.outTask, { a: [], type: 'finalcb' });
  t.end();  
});

test('single task, err and out params', function (t) {
  var fn = chainDefine()
    .out('err', 'c')
    .async(falpha).in().out('err', 'c')
    .end();
  t.deepEqual(fn.ast.inParams, []);
  t.deepEqual(fn.ast.tasks, [
    { f: falpha, type: 'cb', a: [], out: ['c'], name: 'falpha' }
  ]);
  t.deepEqual(fn.ast.outTask, { a: ['c'], type: 'finalcb' });
  t.end();  
});

test('single task, ERR and out params', function (t) {
  var fn = chainDefine()
    .out('ERR', 'c')
    .async(falpha).in().out('ERR', 'c')
    .end();
  t.deepEqual(fn.ast.inParams, []);
  t.deepEqual(fn.ast.tasks, [
    { f: falpha, type: 'cb', a: [], out: ['c'], name: 'falpha' }
  ]);
  t.deepEqual(fn.ast.outTask, { a: ['c'], type: 'finalcb' });
  t.end();  
});

test('cb used in defs is simply ignored', function (t) {
  var fn = chainDefine()
    .in('a', 'b', 'cb')
    .out('err', 'c')
    .async(falpha).in('a', 'b', 'cb').out('err', 'c')
    .end();
  t.deepEqual(fn.ast.inParams, ['a', 'b']);
  t.deepEqual(fn.ast.tasks, [
    { f: falpha, type: 'cb', a: ['a', 'b'], out: ['c'], name: 'falpha'}
  ]);
  t.deepEqual(fn.ast.outTask, { a: ['c'], type: 'finalcb' });
  t.end();  
});

test('callback used in defs is simply ignored', function (t) {
  var fn = chainDefine()
    .in('a', 'b', 'callback')
    .out('err', 'c')
    .async(falpha).in('a', 'b', 'callback').out('err', 'c')
    .end();
  t.deepEqual(fn.ast.inParams, ['a', 'b']);
  t.deepEqual(fn.ast.tasks, [
    { f: falpha, type: 'cb', a: ['a', 'b'], out: ['c'], name: 'falpha'}
  ]);
  t.deepEqual(fn.ast.outTask, { a: ['c'], type: 'finalcb' });
  t.end();  
});

test('two inputs, two tasks, two out params', function (t) {
  var fn = chainDefine()
    .in('a', 'b', 'cb')
    .out('err', 'c', 'd')
    .async(falpha).in('a', 'b', 'cb').out('err', 'c')
    .async(fbeta).in('a', 'b', 'cb').out('err', 'd', 'e')
    .end();
  t.deepEqual(fn.ast.inParams, ['a', 'b']);
  t.deepEqual(fn.ast.tasks, [
    { f: falpha, type: 'cb', a: ['a', 'b'], out: ['c'], name: 'falpha'},
    { f: fbeta, type: 'cb', a: ['a', 'b'], out: ['d', 'e'], name: 'fbeta'}
  ]);
  t.deepEqual(fn.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
  t.end();  
});

test('two inputs, two tasks, two out params, name, options', function (t) {
  var fn = chainDefine()
    .name('myflow')
    .in('a', 'b', 'cb')
    .out('err', 'c', 'd')
    .options({ otherOptFoo: 'foo'})
    .async(falpha).in('a', 'b', 'cb').out('err', 'c').name('myalpha')
    .async(fbeta).in('a', 'b', 'cb').out('err', 'd', 'e').options({ bar: 'bar'})
    .end();
  t.deepEqual(fn.ast.inParams, ['a', 'b']);
  t.deepEqual(fn.ast.tasks, [
    { f: falpha, type: 'cb', a: ['a', 'b'], out: ['c'], name: 'myalpha'},
    { f: fbeta, type: 'cb', a: ['a', 'b'], out: ['d', 'e'],
      bar: 'bar', name: 'fbeta' }
  ]);
  t.deepEqual(fn.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
  t.equal(fn.ast.name, 'myflow', 'name should match if supplied');
  t.equal(fn.ast.otherOptFoo, 'foo', 'other options should pass through');
  t.end();  
});

test('two inputs, two mixed tasks, two out params', function (t) {
  var fn = chainDefine()
    .in('a', 'b', 'cb')
    .out('err', 'c', 'd')
    .async(falpha).in('a', 'b', 'cb').out('err', 'c')
    .sync(fbeta).in('a', 'b').out('d')
    .end();
  t.deepEqual(fn.ast.inParams, ['a', 'b']);
  t.deepEqual(fn.ast.tasks, [
    { f: falpha, type: 'cb', a: ['a', 'b'], out: ['c'], name: 'falpha'},
    { f: fbeta, type: 'ret', a: ['a', 'b'], out: ['d'], name: 'fbeta'}
  ]);
  t.deepEqual(fn.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
  t.end();  
});

test('two inputs, two mixed tasks, two out params, opts', function (t) {
  var fn = chainDefine()
    .in('a', 'b', 'cb')
    .out('err', 'c', 'd')
    .async(falpha).in('a', 'b', 'cb').out('err', 'c').after(fbeta)
    .sync(fbeta).in('a', 'b').out('d')
    .end();
  t.deepEqual(fn.ast.inParams, ['a', 'b']);
  t.deepEqual(fn.ast.tasks, [
    { f: falpha, type: 'cb', a: ['a', 'b'], out: ['c'], after: ['fbeta'], name: 'falpha'},
    { f: fbeta, type: 'ret', a: ['a', 'b'], out: ['d'], name: 'fbeta'}
  ]);
  t.deepEqual(fn.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
  t.end();  
});

// Object use
test('object prop task params', function (t) {
  var fn = chainDefine()
    .in('a', 'b', 'cb')
    .out('err', 'c', 'e')
    .async(falpha).in('a', 'b.cat', 'cb').out('err', 'c')
    .sync(fbeta).in('c.dog', 'b').out('d')
    .async('d.egg').in('c').out('err', 'e')
    .end();
  t.deepEqual(fn.ast.inParams, ['a', 'b']);
  t.deepEqual(fn.ast.tasks, [
    { f: falpha, type: 'cb', a: ['a', 'b.cat'], out: ['c'], name: 'falpha'},
    { f: fbeta, type: 'ret', a: ['c.dog', 'b'], out: ['d'], name: 'fbeta'},
    { f: 'd.egg', type: 'cb', a: ['c'], out: ['e'], name: 'd.egg'}
  ]);
  t.deepEqual(fn.ast.outTask, { a: ['c', 'e'], type: 'finalcb' });
  t.end();  
});


// selectFirst 

test('selectFirst', function (t) {
  var fn = chainDefine()
    .selectFirst()
    .in('a', 'b', 'cb')
    .out('err', 'c')
    .async(falpha).in('a', 'b', 'cb').out('err', 'c')
    .sync(fbeta).in('a', 'b').out('c')
    .end();
  t.deepEqual(fn.ast.inParams, ['a', 'b']);
  t.deepEqual(fn.ast.tasks, [
    { f: falpha, type: 'cb', a: ['a', 'b'], out: ['c'], name: 'falpha'},
    { f: fbeta,  type: 'ret', a: ['a', 'b'], out: ['c'], name: 'fbeta', after: ['falpha']}
  ]);
  t.deepEqual(fn.ast.outTask, { a: ['c'], type: 'finalcbFirst' });
  t.end();  
});


// full integration tests

test('chainDefine use', function (t) {
  t.plan(8);
  function multiply(a, b, cb) { cb(null, a * b); }
  function add(a, b, cb) { cb(null, a + b); }

  var events = [];
  function accumEvents(task) {
    events.push(task);
  }
  
  var fn = chainDefine()
    .in('a', 'b', 'cb')
    .out('err', 'm', 's')
    .async(multiply).in('a', 'b', 'cb').out('err', 'm')
    .async(add).in('m', 'a', 'cb').out('err', 's')
    .end();

  fn.events.on('task.complete', accumEvents);
  
  fn(2, 3, function (err, m, s) {
    t.deepEqual(err, null, 'should not be any error');
    t.equal(m, 6);
    t.equal(s, 8);
    t.equal(events.length, 2, 'should have seen two task compl events');
    t.equal(events[0].name, 'multiply', 'name matches');
    t.deepEqual(events[0].results, [6], 'results match');
    t.equal(events[1].name, 'add', 'name matches');
    t.deepEqual(events[1].results, [8], 'results match');
    t.end();
  });
});

test('use chainDefine selectFirst with events', function (t) {
  t.plan(7);
  function noSuccess(a, b, cb) {
    setTimeout(function () { cb(null); }, 100); // returns undefined result
  }
  function noSuccessNull(a, b, cb) { cb(null, null); } // returns null result
  function add(a, b, cb) { cb(null, a + b); }

  var events = [];
  function accumEvents(task) {
    events.push(task);
  }

  var fn = chainDefine()
    .selectFirst()
    .in('a', 'b', 'cb')
    .out('err', 'c')
    .async(noSuccess).in('a', 'b', 'cb').out('err', 'c')
    .async(noSuccessNull).in('a', 'b', 'cb').out('err', 'c')
    .async(add).in('a', 'b', 'cb').out('err', 'c')
    .async(noSuccess).in('a', 'b', 'cb').out('err', 'c')
    .end();
  
  fn.events.on('task.complete', accumEvents);
  
  fn(2, 3, function (err, c) {
    t.deepEqual(err, null, 'should not be any error');
    t.equal(c, 5);
    t.equal(events.length, 3, 'should have seen two task compl events');
    t.equal(events[0].name, 'noSuccess', 'name matches');
    t.equal(events[1].name, 'noSuccessNull', 'name matches');
    t.equal(events[2].name, 'add', 'name matches');
    t.deepEqual(events[2].results, [5], 'results match');
    t.end();
  });
});
