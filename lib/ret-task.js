'use strict';

var util = require('util');
var sprintf = require('sprintf').sprintf;

function format_error(errmsg, obj) {
  return sprintf('%s - %s', errmsg, util.inspect(obj));
}

var REQ = 'retTask requires f, a, ret';
var FN_REQ = 'retTask requires f to be a function or string';
var A_REQ = 'retTask requires a to be an array of string param names';
var RET_REQ = 'retTask requires ret to be a string param name or null';

function RetTask(taskDef) {
  Object.keys(taskDef).forEach(function (k) { this[k] = taskDef[k]; });
}

RetTask.validate = function (taskDef) {
  var errors = [];
  if (!taskDef.f || !taskDef.a || (taskDef.ret === undefined)) {
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

    if (! (typeof(taskDef.ret) === 'string' || taskDef.ret === null)) {
      errors.push(format_error(RET_REQ, taskDef));
    }
  }
  return errors;
};

module.exports = RetTask;