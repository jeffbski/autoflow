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
      { type: 'cb', f: load,    a: ['res'],              cb: ['lres'] },
      { type: 'ret', f: upper,  a: ['lres'],            ret: 'ulres'  },
      { type: 'cb', f: prefix,  a: ['prefstr', 'ulres'],  cb: ['plres'] },
      { type: 'cb', f: postfix, a: ['plres', 'poststr'], cb: ['plresp'] }
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
      { type: 'cb', f: load,    a: ['res'],               cb: ['lres'] },
      { type: 'ret', f: upper,  a: ['lres'],             ret: 'ulres'  },
      { type: 'cb', f: makeError, a: ['ulres'],           cb: ['na']  },
      { type: 'cb', f: prefix,  a: ['prefstr', 'na'],     cb: ['plres'] },
      { type: 'cb', f: postfix, a: ['plres', 'poststr'],  cb: ['plresp'] }
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

