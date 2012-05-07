'use strict';
/*global define:true */

if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

/**
   Iterating streams and accumulators, used for iterating over arrays, streams,
   and collecting into array or stream.

   arrayIterator, lineStreamIterator, streamIterator, regexIterator
   out arrayMapTask - collect each item (in order) into an array, returns array
   out streamTask - emit items (in order) on outputStream, ends when hits end

   normal stream in to flowIterator to accumulator (handles ordering for stream out)
   flowIterator adds idx, throttles input with pause, calls accumulator (stream accumulator should invoke pause on in)

  */

define(['./memory-stream'], function (MemoryStream) {
  function StreamIterator() {
    this.idx = 0; // incrementing index, added to emit
  }
  StreamIterator.prototype = new MemoryStream();
  StreamIterator.prototype.constructor = StreamIterator;
  var origMemoryStreamEmit = StreamIterator.prototype.emit; // save original ref
  StreamIterator.prototype.emit = function () {
    var args = Array.prototype.slice.call(arguments);
    if (args[0] === 'data' || args[0] === 'end') {
      args.push(this.idx); // for data this is idx, for end this is count
      this.idx += 1; //only really need to do for data, but end won't hurt
    }
    origMemoryStreamEmit.apply(this, args);
  };


  return {
  };
});