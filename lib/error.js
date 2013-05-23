/*global define:true */

if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(['util'], function (util) {
  'use strict';

  function ensureStackTraceLimitSet(stackTraceLimit) {
    if (!Error.stackTraceLimit || Error.stackTraceLimit < stackTraceLimit) {
      Error.stackTraceLimit = stackTraceLimit;
    }
  }

  function fName(fn) {
    if (!fn) return 'undefined';
    return (fn && fn.name) ? fn.name : fn;
  }

  function formatErrorMeta(err) {
    if (!err.meta) return;
    var vcon = err.meta.vcon;
    var task = err.meta.task;
    var errString = '\n\n';
    if (task && task.f && task.a) {
      errString += ('Error occurs in Task function: ' + fName(task.f) + '(' + task.a.join(',') + ')\n\n');
    }
    if (vcon) {
      errString += 'Variable Context: \n';
      errString += util.inspect(vcon);
      errString +=  '\n\n';
    }
    if (task && task.f) {
      errString += 'Task Source:\n\n';
      errString += task.f.toString(); //TODO need to pretty print function, gets collapsed
      errString += '\n\n';
    }
    return errString;
  }

  function augmentError(err, meta) {
    if (typeof(err) === 'string') { err = new Error(err); } //props will be lost on non-objects
    var origMsg = err.toString();
    err.meta = meta;
    err.toString = function () { return origMsg + formatErrorMeta(err); };
    return err;
  }

  return {
    ensureStackTraceLimitSet: ensureStackTraceLimitSet,
    augmentError: augmentError
  };

});