'use strict';

var util = require('util');
var sprintf = require('sprintf').sprintf;

function format_error(errmsg, obj) {
  return sprintf('%s - %s', errmsg, util.inspect(obj));
}

var REQ = 'cbTask requires f, a, cb';
var FN_REQ = 'cbTask requires f to be a function or string';
var A_REQ = 'cbTask requires a to be an array of string param names';
var CB_REQ = 'cbTask requires cb to be an array of string param names';



function CbTask() {
}

CbTask.validate = function (taskDef) {
  var errors = [];
  if (!taskDef.f || !taskDef.a || !taskDef.cb) {
    errors.push(format_error(REQ, taskDef));
  } else {
    var ftype = typeof(taskDef.f);
    if (! ((taskDef.f instanceof Function) || (ftype === 'string'))) {
      errors.push(format_error(FN_REQ, taskDef));
    }
    if (! (Array.isArray(taskDef.a) &&
           taskDef.a.every(function (x) { return (typeof(x) === 'string'); }))) {
      errors.push(format_error(A_REQ, taskDef));
    }
    if (! (Array.isArray(taskDef.cb) &&
           taskDef.cb.every(function (x) { return (typeof(x) === 'string'); }))) {
      errors.push(format_error(CB_REQ, taskDef));
    }
  }
  return errors;
};

module.exports = CbTask;