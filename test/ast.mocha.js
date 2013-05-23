/*global react:true */

if (typeof(chai) === 'undefined') {
  var chai = require('chai');
}

if (typeof(react) === 'undefined') {
  var react = require('../'); //require('react');
}

(function () {
  'use strict';

  var t = chai.assert;

/**
   Testing ast
  */


  suite('ast');

  function load(res, cb) { cb(null, res + '-loaded'); }
  function prefix(prefstr, str, cb) { cb(null, prefstr + str); }
  function postfix(str, poststr, cb) { cb(null, str + poststr); }
  function upper(str) { return str.toUpperCase(); }
  function makeError(str, cb) { cb(new Error('makeErr-' + str)); }

  test('mixed', function (done) {
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
      done();
    });
  });

  test('ast.defined event called when ast is defined', function (done) {
    var fn = react();
    var collector = react.createEventCollector();
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
    t.isObject(events[0].ast);
    t.isNotNull(events[0].ast.inParams);
    t.isNotNull(events[0].ast.tasks);
    t.isNotNull(events[0].ast.outTask);
    done();
  });

  test('ast.defined event is passed to process', function (done) {
    // browser might not have this, so only if process is an eventemitter
    if (typeof process !== 'undefined' && process && process.once) {
      var fn = react();
      process.once('ast.defined', function (ast) {
        t.isObject(ast);
        t.isNotNull(ast.inParams);
        t.isNotNull(ast.tasks);
        t.isNotNull(ast.outTask);
        t.deepEqual(ast.inParams, ['res', 'prefstr', 'poststr']);
        done();
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
    } else {
      done(); //skipping in browser
    }
  });

  test('cb with err', function (done) {
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
      done();
    });
  });

}());