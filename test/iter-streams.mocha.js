'use strict';
/*global iterStreams:true common:true MemoryStream:true react:true */

if (typeof(chai) === 'undefined') {
  var chai = require('chai');
}

if (typeof(iterStreams) === 'undefined') {
  var iterStreams = require('../lib/iter-streams');
}

if (typeof(common) === 'undefined') {
  var common = require('../lib/common');
}

if (typeof(MemoryStream) === 'undefined') {
  var MemoryStream = require('../lib/memory-stream');
}

if (typeof(react) === 'undefined') {
  var react = require('../lib/react');
}

(function () {

  var t = chai.assert;

/**
   Testing iterating streams and accumulators
  */


  suite('iter-streams');

  test('isObject', function () {
    t.isObject(iterStreams);
  });

  test('MemoryStream can read string array and iterate as stream', function (done) {
    var arr = ['one', 'two'];
    var ms = MemoryStream.createReadStream(arr, { useRawData: true });
    var accum = [];
    ms.on('data', function (data, idx) {
      if (common.isBuffer(data)) data = data.toString();
      accum.push(data);
    });
    ms.on('end', function () {
      t.deepEqual(accum, arr);
      done();
    });
  });

  test('MemoryStream can read integer array and iterate as stream', function (done) {
    var arr = [100, 200];
    var ms = MemoryStream.createReadStream(arr, { useRawData: true });
    var accum = [];
    ms.on('data', function (data, idx) {
      if (common.isBuffer(data)) data = data.toString();
      accum.push(data);
    });
    ms.on('end', function () {
      t.deepEqual(accum, arr);
      done();
    });
  });

  test('arrayIterator with outArrayMapTask plus concurrent throttles flow, ret result[]', function (done) {
    var concurrent = 0;
    function countAndDelay(a, cb) {
      concurrent += 1;
      setTimeout(function () {
        cb(null, concurrent);
        concurrent -= 1;
      }, 50);
    }

    var fn = react();
    var errors = fn.setAndValidateAST({
      inParams: ['arr'],
      tasks: [
        { f: countAndDelay,   a: [':it'],  out: [':result']  }
      ],
      outTask: { a: ['concCounts'] },
      arrayIterator: 'arr',
      concurrent: 2,
      arrayMapAccumulator: 'concCounts'
    });

    t.deepEqual(errors, []);

    fn([100, 200, 300, 400], function cb(err, resultArr) {
      t.equal(err, null);
      t.deepEqual(resultArr, [2, 2, 2, 1]);
      done();
    });
  });


}());