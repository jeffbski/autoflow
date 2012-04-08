'use strict';
/*global define:true Buffer:false */

if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

/**
   Common utilities to make it easier to share browser/server code
*/

define([], function () {

  function nextTick(fn) {
    if (typeof(process) !== 'undefined' && typeof(process.nextTick) === 'function') {
      return process.nextTick(fn);
    } else {
      return setTimeout(fn, 0);
    }
  }

  /**
     is true if running on server where Buffer is available

     @example
     if (util.hasBuffer()) console.log('Buffer is available here');

     @return - true if Buffer is available, always false in the browser
    */
  function hasBuffer() {
    return (typeof(Buffer) !== 'undefined');
  }

  /**
     test whether object is a Buffer, always false in browser

     @example
     if (util.isBuffer(obj)) console.log('obj is a buffer');

     @param obj - object to test whether it is a Buffer
     @return - true if is a Buffer, always false in the browser
    */
  var isBuffer; // will be fn that tests for Buffer in node.js, otherwise false in browser
  if (hasBuffer()) {
    isBuffer = function (obj) {
      return Buffer.isBuffer(obj);
    };
  } else { // in browser just return false, no Buffer
    isBuffer = function (obj) {
      return false;
    };
  }

  return {
    nextTick: nextTick,
    hasBuffer: hasBuffer,
    isBuffer: isBuffer
  };

});