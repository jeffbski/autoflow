'use strict';

var test = require('tap').test;

var react = require('../'); // require('react');
var EventCollector = require('../lib/event-collector');

function load(res, cb) { cb(null, res + '-loaded'); }
function prefix(prefstr, str, cb) { cb(null, prefstr + str); }
function postfix(str, poststr, cb) { cb(null, str + poststr); }
function upper(str) { return str.toUpperCase(); }
function makeError(str, cb) { cb(new Error('makeErr-' + str)); }

test('mixed', function (t) {
  t.plan(5);
  
  var fn = react();
  var errors = fn.setAndValidateAST({
    inParams: ['res', 'prefstr', 'poststr'],
    tasks: [
      { f: load,    a: ['res'],              out: ['lres'] },
      { f: upper,   a: ['lres'],             out: ['ulres'], type: 'ret'  },
      { f: prefix,  a: ['prefstr', 'ulres'], out: ['plres'] },
      { f: postfix, a: ['plres', 'poststr'], out: ['plresp'] }
    ],
    outTask: { a: ['plresp'] }
  });

  t.deepEqual(errors, []);

  fn('foo', 'pre-', '-post', function cb(err, lres) {
    t.equal(err, null);
    t.equal(lres, 'pre-FOO-LOADED-post');
  });

  fn('bar', 'PRE-', '-POST', function cb(err, lres) {
    t.equal(err, null);
    t.equal(lres, 'PRE-BAR-LOADED-POST');
  });
});

test('ast.defined event called when ast is defined', function (t) {
  var fn = react();
  var collector = new EventCollector();
  collector.capture(fn, 'ast.*');
  
  var errors = fn.setAndValidateAST({
    inParams: ['res', 'prefstr', 'poststr'],
    tasks: [
      { f: load,    a: ['res'],              out: ['lres'] },
      { f: upper,   a: ['lres'],             out: ['ulres'], type: 'ret'  },
      { f: prefix,  a: ['prefstr', 'ulres'], out: ['plres'] },
      { f: postfix, a: ['plres', 'poststr'], out: ['plresp'] }
    ],
    outTask: { a: ['plresp'] }
  });

  var events = collector.list();
  t.equal(events.length, 1);
  t.type(events[0].ast, 'object');
  t.ok(events[0].ast.inParams);
  t.ok(events[0].ast.tasks);
  t.ok(events[0].ast.outTask);
  t.end();
});

test('ast.defined event is passed to process', function (t) {
  t.plan(5);
  var fn = react();
  process.once('ast.defined', function (ast) {
    t.type(ast, 'object');
    t.ok(ast.inParams);
    t.ok(ast.tasks);
    t.ok(ast.outTask);
    t.deepEqual(ast.inParams, ['res', 'prefstr', 'poststr']);
    t.end();
  });
  var errors = fn.setAndValidateAST({
    inParams: ['res', 'prefstr', 'poststr'],
    tasks: [
      { f: load,    a: ['res'],              out: ['lres'] },
      { f: upper,   a: ['lres'],             out: ['ulres'], type: 'ret'  },
      { f: prefix,  a: ['prefstr', 'ulres'], out: ['plres'] },
      { f: postfix, a: ['plres', 'poststr'], out: ['plresp'] }
    ],
    outTask: { a: ['plresp'] }
  });
});

test('cb with err', function (t) {
  t.plan(5);
  
  var fn = react();
  var errors = fn.setAndValidateAST({
    inParams: ['res', 'prefstr', 'poststr'],
    tasks: [
      { f: load,      a: ['res'],               out: ['lres'] },
      { f: upper,     a: ['lres'],              out: ['ulres'], type: 'ret' },
      { f: makeError, a: ['ulres'],             out: ['na']  },
      { f: prefix,    a: ['prefstr', 'na'],     out: ['plres'] },
      { f: postfix,   a: ['plres', 'poststr'],  out: ['plresp'] }
    ],
    outTask: { a: ['plresp'] }
  });

  t.deepEqual(errors, []);

  fn('foo', 'pre-', '-post', function cb(err, lres) {
    t.equal(err.message, 'makeErr-FOO-LOADED');
    t.equal(lres, undefined);
  });

  fn('bar', 'PRE-', '-POST', function cb(err, lres) {
    t.equal(err.message, 'makeErr-BAR-LOADED');
    t.equal(lres, undefined);
  });
});

