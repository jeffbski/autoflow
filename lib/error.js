'use strict';

var util = require('util');

function ensureStackTraceLimitSet(stackTraceLimit) {
  if (!Error.stackTraceLimit || Error.stackTraceLimit < stackTraceLimit) {
    Error.stackTraceLimit = stackTraceLimit;
  }
}

function fName(fn) {
  return (typeof(fn) === 'string') ? fn : fn.name;
}

function formatErrorMeta(err) {
  if (!err.meta) return;
  var vcon = err.meta.vcon;
  var task = err.meta.task;
  return '\n\n' +
      'Error occurs in Task function: ' + fName(task.f) + '(' + task.a.join(',') + ')\n\n' + 
      'Variable Context: \n' +
      util.inspect(vcon) + '\n\n' +
      'Task Source:\n\n' +
      task.f.toString() + '\n\n'; //TODO need to pretty print function, gets collapsed
}

function augmentError(err, meta) {
  if (typeof(err) === 'string') { err = new Error(err); } //props will be lost on non-objects
  var origMsg = err.toString();
  err.meta = meta;
  err.toString = function () { return origMsg + formatErrorMeta(err); };
  return err;
}


exports.ensureStackTraceLimitSet = ensureStackTraceLimitSet;
exports.augmentError = augmentError;
