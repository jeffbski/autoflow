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
     Testing exec options
  */

  suite('exec-options');

  function multiply(x, y, cb) { cb(null, x * y); }

  test('execOptions as first param', function (done) {
    var fn = react();
    var errors = fn.setAndValidateAST({
      inParams: ['a', 'b'],
      tasks: [
        { f: multiply, a: ['a', 'b'], out: ['c'] }
      ],
      outTask: { a: ['c'] }
    });
    t.deepEqual(errors, [], 'no validation errors');

    var execOptions = {
      reactExecOptions: true,
      outputStyle: 'cb'
    };

    fn(execOptions, 2, 3, function (err, c) {
      t.equal(err, null);
      t.equal(c, 6);
      done();
    });
  });


}());