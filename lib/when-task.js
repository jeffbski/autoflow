'use strict';

/**
   When task which checks if is a promise (has a then method)
   and waits for it to resolve.

   If argument does not have a then method, it resolves immediately
  */

var util = require('util');
var sprintf = require('sprintf').sprintf;

var BaseTask = require('./base-task.js');

function format_error(errmsg, obj) {
  return sprintf('%s - %s', errmsg, util.inspect(obj));
}

var REQ = 'whenTask requires a, out';
var A_REQ = 'whenTask requires a to be an array[1] of string param names';
var OUT_REQ = 'whenTask requires out to be an array[1] of string param names';

function WhenTask(taskDef) {
  var self = this;
  Object.keys(taskDef).forEach(function (k) { self[k] = taskDef[k]; });
}

WhenTask.prototype = new BaseTask();
WhenTask.prototype.constructor = WhenTask;

WhenTask.prototype.f = function when() { // just here to keep validations happy 
}

WhenTask.validate = function (taskDef) {
  var errors = [];
  if (!taskDef.a || !taskDef.out) {
    errors.push(format_error(REQ, taskDef));
  } else {
    if (! (Array.isArray(taskDef.a) && taskDef.a.length === 1 && 
           taskDef.a.every(function (x) { return (typeof(x) === 'string'); }))) {
      errors.push(format_error(A_REQ, taskDef));
    }
    if (! (Array.isArray(taskDef.out) && taskDef.out.length <= 1 && 
           taskDef.out.every(function (x) { return (typeof(x) === 'string'); }))) {
      errors.push(format_error(OUT_REQ, taskDef));
    }
  }
  return errors;
};

WhenTask.prototype.prepare = function prepare(handleTaskError, vCon, contExec) {
  var self = this;
  this.nextFn = function (arg) {
    var args = Array.prototype.slice.call(arguments);
    vCon.saveResults(self.out, args);
    self.complete(args);
    contExec();
  };
  this.failFn = function (err) {
    handleTaskError(self, err);
  };
};

WhenTask.prototype.exec = function exec(vCon, handleError, contExec) {
  try {
    var args = this.a.map(function (k) { return vCon.getVar(k); }); //get args from vCon
    //console.error('WhenTask.exec.args=', args);
    //console.error('WhenTask.exec.vCon=', vCon);
    this.start(args); //note the start time, args
    var arg = args[0]; // one value allowed
    if (arg && typeof(arg.then) === 'function') { // is a promise
      arg.then(this.nextFn, this.failFn);
    } else { // not a promise continue immediately
      this.nextFn(arg);
    }
  } catch (err) { //catch and handle the task error, calling final cb
    handleError(this, err);
  } 
};

module.exports = WhenTask;