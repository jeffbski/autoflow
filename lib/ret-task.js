/*global define:true */

if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(['util', './sprintf', './base-task'], function (util, sprintf, BaseTask) {
  'use strict';

  function format_error(errmsg, obj) {
    return sprintf('%s - %s', errmsg, util.inspect(obj));
  }

  var REQ = 'retTask requires f, a, out';
  var FN_REQ = 'retTask requires f to be a function or string';
  var A_REQ = 'retTask requires a to be an array of string param names';
  var RET_REQ = 'retTask requires out to be an array with single string param name or []';

  function RetTask(taskDef) {
    var self = this;
    Object.keys(taskDef).forEach(function (k) { self[k] = taskDef[k]; });
  }

  RetTask.prototype = new BaseTask();
  RetTask.prototype.constructor = RetTask;

  RetTask.validate = function (taskDef) {
    var errors = [];
    if (!taskDef.f || !taskDef.a || !taskDef.out) {
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

      if (! (Array.isArray(taskDef.out) &&
             (taskDef.out.length === 0 ||
              (taskDef.out.length === 1 && typeof(taskDef.out[0] === 'string'))))) {
        errors.push(format_error(RET_REQ, taskDef));
      }
    }
    return errors;
  };

  RetTask.prototype.exec = function exec(vCon, handleError, contExec) {
    try {
      var args = this.a.map(function (k) { return vCon.getVar(k); }); //get args from vCon
      this.start(args); //note the start time, args
      var func = this.f;
      var bindObj = vCon.getVar('this'); //global space or the original this
      if (this.isMethodCall()) { //if method call then reset func and bindObj
        func = vCon.getVar(this.f);
        bindObj = this.getMethodObj(vCon);
      } else if (typeof(func) === 'string') {
        func = vCon.getVar(func); // we want the actual fn from this string
      }
      var results = [func.apply(bindObj, args)];
      vCon.saveResults(this.out, results); // save retval, takes arrays
      this.complete(results);
      contExec();       // continue since no callback to run this
    } catch (err) { handleError(this, err); }    // catch and handle the task error, calling final cb
  };

  return RetTask;

});