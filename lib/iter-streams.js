'use strict';
/*global define:true */

if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

/**
   Iterating streams and accumulators, used for iterating over arrays, streams,
   and collecting into array or stream.

   StreamIterator - emits data + idx  and end with count

     // arrayIterator, lineStreamIterator, streamIterator, regexIterator
     // iterTask.onEach - clone vcon set up iter values, kick off flow
     // iterTask.onError - stop iteration, return error
     // iterTask.onEnd - iteration has ended, once all complete return result
     // iterTask.pause()
     // iterTask.resume()
     // iterTask.destroy()
     // iterTask.destroySoon()
     // iterTask.itemComplete - called when an item has completed

    // ordering buffer - ensures that the items come out in order, buffers early items

    // outStreamHandlers
    // out arrayMapTask - collect each item (in order) into an array, returns array
    // out streamTask - emit items (in order) on outputStream, ends when hits end

    // inIterStream -> throttleStream -> flowIteration -> orderedBufferStream -> outStreamHandler = flowStream
   
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
    StreamIterator: StreamIterator
  };
});  