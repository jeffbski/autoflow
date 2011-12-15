'use strict';

var util = require('util');
var sprintf = require('sprintf').sprintf;

var BaseTask = require('./base-task.js');

function format_error(errmsg, obj) {
  return sprintf('%s - %s', errmsg, util.inspect(obj));
}

var REQ = 'cbTask requires f, a, out';
var FN_REQ = 'cbTask requires f to be a function or string';
var A_REQ = 'cbTask requires a to be an array of string param names';
var CB_REQ = 'cbTask requires out to be an array of string param names';

function CbTask(taskDef) {
  var self = this;
  Object.keys(taskDef).forEach(function (k) { self[k] = taskDef[k]; });
}

CbTask.prototype = new BaseTask();
CbTask.prototype.constructor = CbTask;

CbTask.validate = function (taskDef) {
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
           taskDef.out.every(function (x) { return (typeof(x) === 'string'); }))) {
      errors.push(format_error(CB_REQ, taskDef));
    }
  }
  return errors;
};

CbTask.prototype.exec = function exec(vCon, handleError, contExec) {
  try {
    var args = this.a.map(function (k) { return vCon.getVar(k); }); //get args from vCon
    //console.error('CbTask.exec.args=', args);
    //console.error('CbTask.exec.vCon=', vCon);
    this.start(args); //note the start time, args
    args.push(this.cbFun);   // push callback fn on end
    var func = this.f;
    var bindObj = null; //global space
    if (this.isMethodCall()) { //if method call then reset func and bindObj
      func = vCon.getVar(this.f);
      bindObj = this.getMethodObj(vCon);
    } else if (typeof(func) === 'string') {
      func = vCon.getVar(func); // we want the actual fn from this string
    }
    func.apply(bindObj, args); 
  } catch (err) { //catch and handle the task error, calling final cb
    handleError(this, err);
  }    
};

module.exports = CbTask;