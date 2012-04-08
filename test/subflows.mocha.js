'use strict';
/*global react:true */

if (typeof(chai) === 'undefined') {
  var chai = require('chai');
}

if (typeof(react) === 'undefined') {
  var react = require('../'); //require('react');
}

(function () {

  var t = chai.assert;

/**
   Testing subflows
  */


  suite('subflows');

  test('subflows defined, creates flow fns in sub', function () {
    function load() { }
    function prefix() { }
    function postfix() { }
    
    var fn = react();
    var collector = react.createEventCollector();
    collector.capture(fn, 'ast.*');
    
    var errors = fn.setAndValidateAST({
      inParams: ['res', 'prefstr', 'poststr'],
      tasks: [
        { f: "sub:fn1",    a: ['res'],              out: ['lres'] },
        { f: "sub:fn2",   a: ['lres'],             out: ['ulres'], type: 'ret'  },
        { f: prefix,  a: ['prefstr', 'ulres'], out: ['plres'] },
        { f: postfix, a: ['plres', 'poststr'], out: ['plresp'] }
      ],
      outTask: { a: ['plresp'] },
      sub: {
        fn1: {
          inParams: ['foo'],
          tasks: [
            { f: load,    a: ['foo'],              out: ['bar'] }
          ],
          outTask: { a: ['bar'] }
        },
        fn2: {
          inParams: ['baz'],
          tasks: [
            { f: load,    a: ['baz'],              out: ['cat'] }
          ],
          outTask: { a: ['cat'] }
        }
      }
    });

    var events = collector.list();
    t.equal(events.length, 1);
    t.isObject(events[0].ast.sub);
    t.isFunction(events[0].ast.sub.fn1);
    t.isObject(events[0].ast.sub.fn1.ast); 
    t.isNotNull(events[0].ast.sub.fn1.ast.inParams);
    t.isNotNull(events[0].ast.sub.fn1.ast.tasks);
    t.isNotNull(events[0].ast.sub.fn1.ast.outTask);
    t.isFunction(events[0].ast.sub.fn2);
    t.isObject(events[0].ast.sub.fn2.ast); 
    t.isNotNull(events[0].ast.sub.fn2.ast.inParams);
    t.isNotNull(events[0].ast.sub.fn2.ast.tasks);
    t.isNotNull(events[0].ast.sub.fn2.ast.outTask);
  });

  test('subflow simple exec', function (done) {
    function suffix(str, cb) {
      return cb(null, str + "_end");
    }
    
    var fn = react();
    var errors = fn.setAndValidateAST({
      inParams: ['bar'],
      tasks: [
        { f: "sub:fn1",    a: ['bar'],              out: ['baz'] }
      ],
      outTask: { a: ['baz'] },
      sub: {
        fn1: {
          inParams: ['sbar'],
          tasks: [
            { f: suffix,    a: ['sbar'],              out: ['sbaz'] }
          ],
          outTask: { a: ['sbaz'] }
        }
      }
    });
    t.deepEqual(errors, []);
    fn('hello', function (err, result) {
      t.isNull(err);
      t.equal(result, 'hello_end');
      done();
    });
  });

  test('subflow array iterate exec', function (done) {
    var idx = 0;
    function suffix(str, suffStr, cb) { // we'll make things come in out of order
      var delay = (idx) ? 1 : 20; // make first delay 20ms, second 1ms
      idx += 1;
      setTimeout(function () {
        return cb(null, str + suffStr);
      }, delay);
    }
    
    var fn = react();

    var errors = fn.setAndValidateAST({
      inParams: ['lines', 'suff'],
      tasks: [
        { f: "sub:fn1",    a: ['lines', 'suff'],  out: ['resultLines'] }
      ],
      outTask: { a: ['resultLines'] },
      sub: {
        fn1: {
          inParams: ['lines', 'suff'],
          tasks: [
            { f: suffix, a: ['lines', 'suff'],  out: ['suffixLines'], type:'arrayMap', arrIn: 'lines' }
          ],
          outTask: { a: ['suffixLines'] }
        }
      }
    });
    
    t.deepEqual(errors, []);
    fn(['hello', 'world'], '_END', function (err, results) {
      t.isNull(err);
      t.deepEqual(results, ['hello_END', 'world_END']);
      done();
    });
  });

  test('subflow array iterate exec, error stops execution', function (done) {
    var idx = 0;
    function suffix(str, suffStr, cb) { 
      idx += 1;
      if (idx === 2) {
        setTimeout(function () {
          return cb(new Error('My error'));
        }, 10);
      } else {
        setTimeout(function () {
          return cb(null, str + suffStr);
        }, 10);          
      }
    }
    
    var fn = react();

    var errors = fn.setAndValidateAST({
      inParams: ['lines', 'suff'],
      tasks: [
        { f: "sub:fn1",    a: ['lines', 'suff'],  out: ['resultLines'] }
      ],
      outTask: { a: ['resultLines'] },
      sub: {
        fn1: {
          inParams: ['lines', 'suff'],
          tasks: [
            { f: suffix, a: ['lines', 'suff'],  out: ['suffixLines'], type:'arrayMap', arrIn: 'lines' }
          ],
          outTask: { a: ['suffixLines'] }
        }
      }
    });
    
    t.deepEqual(errors, []);
    fn(['hello', 'world'], '_END', function (err, results) {
      t.equal(err.message, 'My error');
      done();
    });
  });


  test('subflow stream iterate exec - substream1', function (done) {
    react.logEvents();
    var idx = 0;
    function suffix(str, suffStr, cb) { // we'll make things come in out of order
      var delay = (idx) ? 1 : 20; // make first delay 20ms, second 1ms
      idx += 1;
      setTimeout(function () {
        return cb(null, str + suffStr);
      }, delay);
    }
    
    var fn = react();

    var errors = fn.setAndValidateAST({
      inParams: ['lineStream', 'suff', 'resultStream'],
      tasks: [
        { f: "sub:fn1",    a: ['lineStream', 'suff', 'resultStream'],  out: [] }
      ],
      outTask: { a: [], type: 'finalStream', stream: 'resultStream' },
      sub: {
        fn1: {
          inParams: ['lineStream', 'suff', 'resultStream'],
          tasks: [
            { f: suffix, a: ['lineStream', 'suff'],  out: ['suffixLine'],
              type:'stream', streamIn: 'lineStream', streamOut: 'resultStream' }
          ],
          outTask: { a: [] }
        }
      }
    });
    
    t.deepEqual(errors, []);

    var srcStream = new react.Stream();
    var dstStream = new react.Stream();

    var accum = [];
    fn(srcStream, '_END', dstStream).on('data', function (data) {
      accum.push(data.toString());
    }).on('end', function () {
      t.deepEqual(accum, ['hello_END', 'world_END']);
      done();
    }).on('error', function (err) {
      done(err);
    });

    setTimeout(function () {
      srcStream.emit('data', 'hello');
      srcStream.emit('data', 'world');
      srcStream.emit('end');
    }, 10);
  });
  

  

}());  