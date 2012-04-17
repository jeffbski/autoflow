'use strict';
/*global react:true taskUtil:true */

if (typeof(chai) === 'undefined') {
  var chai = require('chai');
}

if (typeof(react) === 'undefined') {
  var react = require('../'); //require('react');
}

if (typeof(taskUtil) === 'undefined') {
  var taskUtil = require('../lib/task.js');  
}

(function () {

  var t = chai.assert;

  /**
     Testing final stream task
  */

  suite('finalstream-task');

  test('invalid taskdef missing arr errors', function (done) {
    var errors = taskUtil.validateOutTask({ type: 'finalStream' });
    t.deepEqual(errors, [ 'ast.outTask.a should be an array of string param names of len <= 1 - { type: \'finalStream\' }' ]);
    done();
  });

  test('invalid taskdef arr too large errors', function (done) {
    var errors = taskUtil.validateOutTask({ a: ['foo', 'bar'], type: 'finalStream' });
    t.deepEqual(errors, [ 'ast.outTask.a should be an array of string param names of len <= 1 - { a: [ \'foo\', \'bar\' ], type: \'finalStream\' }' ]);
    done();
  });

  test('invalid taskdef stream not string errors', function (done) {
    var errors = taskUtil.validateOutTask({ a: [], stream: 1, type: 'finalStream' });
    t.deepEqual(errors, [ 'ast.outTask.stream should be a string - { a: [], stream: 1, type: \'finalStream\' }' ]);
    done();
  });
  
  test('valid taskdef creates outTask', function (done) {
    function foo() { }
    var finalTask = taskUtil.createOutTask({ a: ['bar'], type: 'finalStream' });
    t.deepEqual(finalTask.a, ['bar']);
    done();
  });

  test('finalStream simple exec', function (done) {
    function suffix(str, cb) {
      setTimeout(function () {
        return cb(null, str + "_end");
      }, 10);
    }
    
    var fn = react();
    var errors = fn.setAndValidateAST({
      inParams: ['str'],
      tasks: [
        { f: suffix, a: ['str'], out: ['suffstr'] }
      ],
      outTask: { a: ['suffstr'], type: 'finalStream' }
    });
    t.deepEqual(errors, []);
    var accum = [];
    fn('hello').on('data', function (result) {
      accum.push(result.toString());
    }).on('end', function () {
      t.deepEqual(accum, ['hello_end']);
      done();
    }).on('error', function (err) {
      done(err);
    });
  });

  test('finalStream simple exec using precreated out stream', function (done) {
    function suffix(str, cb) {
      setTimeout(function () {
        return cb(null, str + "_end");
      }, 10);
    }
    
    var fn = react();
    var errors = fn.setAndValidateAST({
      inParams: ['str', 'outStream'],
      tasks: [
        { f: suffix, a: ['str'], out: ['suffstr'] }
      ],
      outTask: { a: ['suffstr'], type: 'finalStream', stream: 'outStream' }
    });
    t.deepEqual(errors, []);
    var accum = [];
    var outStream = new react.Stream();
    outStream.on('data', function (result) {
      accum.push(result.toString());
    }).on('end', function () {
      t.deepEqual(accum, ['hello_end']);
      done();
    }).on('error', function (err) {
      done(err);
    });

    fn('hello', outStream);
  });

  test('finalStream simple exec using precreated out stream, rets same', function (done) {
    function suffix(str, cb) {
      setTimeout(function () {
        return cb(null, str + "_end");
      }, 10);
    }
    
    var fn = react();
    var errors = fn.setAndValidateAST({
      inParams: ['str', 'outStream'],
      tasks: [
        { f: suffix, a: ['str'], out: ['suffstr'] }
      ],
      outTask: { a: ['suffstr'], type: 'finalStream', stream: 'outStream' }
    });
    t.deepEqual(errors, []);
    var accum = [];
    var outStream = new react.Stream();
    fn('hello', outStream).on('data', function (result) {
      accum.push(result.toString());
    }).on('end', function () {
      t.deepEqual(accum, ['hello_end']);
      done();
    }).on('error', function (err) {
      done(err);
    });
  });


  
}());  