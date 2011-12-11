'use strict';

var test = require('tap').test;

var react = require('../react');

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

