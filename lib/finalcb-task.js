'use strict';

var sprintf = require('sprintf').sprintf;
var util = require('util');

var STATUS = require('./status.js');

var OUTTASK_A_REQ = 'ast.outTask.a should be an array of string param names';

function FinalCbTask(taskDef, cbFunc, tasks, vCon) {
  var self = this;
  Object.keys(taskDef).forEach(function (k) { self[k] = taskDef[k]; });
  this.f = cbFunc;
  this.tasks = tasks;
  this.vCon = vCon;
}

function format_error(errmsg, obj) {
  return sprintf('%s - %s', errmsg, util.inspect(obj));
}


FinalCbTask.validate = function (taskDef) {
  var errors = [];
  if (! (Array.isArray(taskDef.a) &&
         taskDef.a.every(function (x) { return (typeof(x) === 'string'); }))) {
    errors.push(format_error(OUTTASK_A_REQ, taskDef));
  }
  return errors;
};

FinalCbTask.create = function (taskDef, cbFunc, tasks, vCon) {
  if (!(cbFunc && cbFunc instanceof Function)) throw new Error('callback is not a function'); 
  return new FinalCbTask(taskDef, cbFunc, tasks, vCon);
};

FinalCbTask.prototype.isReady = function () {
  return (this.tasks.every(function (t) { return (t.status === STATUS.COMPLETE); }));
};

FinalCbTask.prototype.exec = function (err) {
  if (!this.f) return;   //must have already been called
  if (err) {
    this.f.call(null, err); //call the final callback with the first error hit
  } else { // no error, call with args
    var vCon = this.vCon;
    var finalArgs = this.a.map(function (k) { return vCon.getVar(k); });
    finalArgs.unshift(null);   //unshift err=null to front
    this.f.apply(null, finalArgs);
  }
  this.f = null;   // prevent multiple calls
};

module.exports = FinalCbTask;