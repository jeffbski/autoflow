'use strict';
/*global iterStreams:true common:true MemoryStream:true */

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

}());