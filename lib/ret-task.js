'use strict';

var util = require('util');
var sprintf = require('sprintf').sprintf;

var BaseTask = require('./base-task.js');

function format_error(errmsg, obj) {
  return sprintf('%s - %s', errmsg, util.inspect(obj));
}

var REQ = 'retTask requires f, a, ret';
var FN_REQ = 'retTask requires f to be a function or string';
var A_REQ = 'retTask requires a to be an array of string param names';
var RET_REQ = 'retTask requires ret to be a string param name or null';

function RetTask(taskDef) {
  var self = this;
  Object.keys(taskDef).forEach(function (k) { self[k] = taskDef[k]; });
}

RetTask.prototype = new BaseTask();
RetTask.prototype.constructor = RetTask;

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

/**
   Property which contains the list of output params
  */
RetTask.outputParamsKey = 'ret';

RetTask.prototype.exec = function exec(vCon, handleError, contExec) {
  try {
    var args = this.a.map(function (k) { return vCon.getVar(k); }); //get args from vCon
    var func = this.f;
    var bindObj = null; //global space
    if (this.isMethodCall()) { //if method call then reset func and bindObj
      func = vCon.getVar(this.f);
      bindObj = this.getMethodObj(vCon);
    } else if (typeof(func) === 'string') {
      func = vCon.getVar(func); // we want the actual fn from this string
    }
    vCon.setVar(this.ret, func.apply(bindObj, args));  //  save retval
    this.complete();
    contExec();       // continue since no callback to run this
  } catch (err) { handleError(this, err); }    // catch and handle the task error, calling final cb
};

module.exports = RetTask;