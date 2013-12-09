/*global autoflow:true */

if (typeof(chai) === 'undefined') {
  var chai = require('chai');
}

if (typeof(autoflow) === 'undefined') {
  var autoflow = require('../'); //require('autoflow');
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
    var fn = autoflow();
    var errors = fn.setAndValidateAST({
      inParams: ['a', 'b'],
      tasks: [
        { f: multiply, a: ['a', 'b'], out: ['c'] }
      ],
      outTask: { a: ['c'] }
    });
    t.deepEqual(errors, [], 'no validation errors');

    var execOptions = {
      autoflowExecOptions: true,
      outputStyle: 'cb'
    };

    fn(execOptions, 2, 3, function (err, c) {
      t.equal(err, null);
      t.equal(c, 6);
      done();
    });
  });


}());
