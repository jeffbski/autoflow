/*global react:true Deferred:true */

if (typeof(chai) === 'undefined') {
  var chai = require('chai');
}

if (typeof(react) === 'undefined') {
  var react = require('../'); //require('react');
}

if (typeof(Deferred) === 'undefined') {
  var Deferred = require('Deferred');
}

(function () {
  'use strict';

  var t = chai.assert;

  suite('core-deferred');

  /**
     Test core PromiseTasks using Deferred - jquery style promises
  */

  function multiply(x, y) {
    var deferred = new Deferred();
    setTimeout(function () {
      deferred.resolve(x * y);
    }, 10);
    return deferred.promise();
  }
  function add(x, y) {
    var deferred = new Deferred();
    setTimeout(function () {
      deferred.resolve(x + y);
    }, 10);
    return deferred.promise();
  }

  function badFunc(a, b) {
    throw new Error('badFuncThrow');
  }

  function badF2(a, b) {
    var deferred = new Deferred();
    setTimeout(function () {
      deferred.reject(new Error('my-error'));
    }, 10);
    return deferred.promise();
  }


  test('multi-step', function (done) {
    var fn = react();
    var errors = fn.setAndValidateAST({
      inParams: ['a', 'b'],
      tasks: [
        { f: multiply, a: ['a', 'b'], out: ['c'], type: 'promise' },
        { f: add, a: ['c', 'b'], out: ['d'], type: 'promise' }
      ],
      outTask: { a: ['c', 'd'] }
    });
    t.deepEqual(errors, [], 'no validation errors');

    fn(2, 3, function (err, c, d) {
      t.equal(err, null);
      t.equal(c, 6);
      t.equal(d, 9);
      done();
    });
  });

  test('using "this" in a cb function', function (done) {
    function getA(cb) {
      /*jshint validthis: true */
      var deferred = new Deferred();
      var self = this;
      setTimeout(function () {
        deferred.resolve(self.a);
      }, 10);
      return deferred.promise();
    }

    var fn = react();
    var errors = fn.setAndValidateAST({
      inParams: [],
      tasks: [
        { f: getA, a: [], out: ['a'], type: 'promise' }
      ],
      outTask: { a: ['a'] }
    });
    t.deepEqual(errors, [], 'no validation errors');

    var obj = {
      a: 100
    };

    fn.apply(obj, [function (err, a) {
      t.equal(err, null);
      t.equal(a, 100);
      done();
    }]);
  });


  test('throws error', function (done) {
    var fn = react();
    var errors = fn.setAndValidateAST({
      inParams: ['a', 'b'],
      tasks: [
        { f: badFunc, a: ['a', 'b'], out: ['c'], type: 'promise' },
        { f: add, a: ['c', 'b'], out: ['d'], type: 'promise' }
      ],
      outTask: { a: ['c', 'd'] }
    });
    t.deepEqual(errors, [], 'no validation errors');

    fn(2, 3, function (err, c, d) {
      t.equal(err.message, 'badFuncThrow');
      done();
    });
  });

  test('rejects with error', function (done) {
    var fn = react();
    var errors = fn.setAndValidateAST({
      inParams: ['a', 'b'],
      tasks: [
        { f: badF2, a: ['a', 'b'], out: ['c'], type: 'promise' },
        { f: add, a: ['c', 'b'], out: ['d'], type: 'promise' }
      ],
      outTask: { a: ['c', 'd'] }
    });
    t.deepEqual(errors, [], 'no validation errors');

    fn(2, 3, function (err, c, d) {
      t.equal(err.message, 'my-error');
      done();
    });
  });

}());