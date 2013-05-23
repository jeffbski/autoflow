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

  suite('promise-auto-resolve');

  /**
     Test that arguments which are promises are automatically resolved
     before calling react functions
  */

  react.resolvePromises(); // enable promise resolving

  function multiply(x, y, cb) { cb(null, x * y); }
  function add(x, y, cb) { cb(null, x + y); }
  // function badF2(a, b, cb) { cb('my-error'); }

  test('auto resolve promises passed as args', function (done) {
    var fn = react();
    var errors = fn.setAndValidateAST({
      inParams: ['a', 'b'],
      tasks: [
        { f: multiply, a: ['a', 'b'], out: ['c'] },
        { f: add, a: ['c', 'b'], out: ['d'] }
      ],
      outTask: { a: ['c', 'd'] }
    });
    t.deepEqual(errors, [], 'no validation errors');

    function retAP() {
      var deferred = new Deferred();
      setTimeout(function () { deferred.resolve(2); }, 10);
      return deferred.promise();
    }

    function retBP() {
      var deferred = new Deferred();
      setTimeout(function () { deferred.resolve(3); }, 10);
      return deferred.promise();
    }

    var ap = retAP();
    var bp = retBP();

    fn(ap, bp, function (err, c, d) {
      t.equal(err, null);
      t.equal(c, 6);
      t.equal(d, 9);
      done();
    });
  });

}());