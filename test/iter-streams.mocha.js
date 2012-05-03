'use strict';
/*global iterStreams:true common:true */

if (typeof(chai) === 'undefined') {
  var chai = require('chai');
}

if (typeof(iterStreams) === 'undefined') {
  var iterStreams = require('../lib/iter-streams');
}

if (typeof(common) === 'undefined') {
  var common = require('../lib/common');
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

  test('StreamIterator adds idx to data and end', function (done) {
    var streamIter = new iterStreams.StreamIterator();
    var accum = [];
    streamIter.on('data', function (data, idx) {
      if (common.isBuffer(data)) data = data.toString();
      accum.push([data, idx]);
    });
    streamIter.on('end', function (count) {
      t.equal(count, 2);
      var expectedAccum = [
        ['one', 0],
        ['two', 1]
      ];
      t.deepEqual(accum, expectedAccum);
      done();
    });
    streamIter.write('one');
    streamIter.write('two');
    streamIter.end();
  });

}());