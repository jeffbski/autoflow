'use strict';

var sprintf = require('sprintf').sprintf;
var util = require('util');

var STATUS = require('./status.js');
var VContext = require('./vcon.js');

var OUTTASK_A_REQ = 'ast.outTask.a should be an array of string param names';

function FinalCbFirstSuccTask(taskDef, cbFunc, tasks, vCon) {
  var self = this;
  Object.keys(taskDef).forEach(function (k) { self[k] = taskDef[k]; });
  this.f = cbFunc;
  this.tasks = tasks;
  this.vCon = vCon;
}

function format_error(errmsg, obj) {
  return sprintf('%s - %s', errmsg, util.inspect(obj));
}

FinalCbFirstSuccTask.validate = function (taskDef) {
  var errors = [];
  if (! (Array.isArray(taskDef.a) &&
         taskDef.a.every(function (x) { return (typeof(x) === 'string'); }))) {
    errors.push(format_error(OUTTASK_A_REQ, taskDef));
  }
  return errors;
}

FinalCbFirstSuccTask.create = function (taskDef, cbFunc, tasks, vCon) {
  if (!(cbFunc && cbFunc instanceof Function)) throw new Error('callback is not a function'); 
  return new FinalCbFirstSuccTask(taskDef, cbFunc, tasks, vCon);
};

/**
   is ready to exit when any task comes back with non-null defined value
  */
FinalCbFirstSuccTask.prototype.isReady = function () {
  var lastres = this.vCon.getLastResults();
  if (!lastres) return false; // no results yet
  return (lastres.some(function (v) { return (v !== undefined && v !== null); }));
};

FinalCbFirstSuccTask.prototype.exec = function (err) {
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

module.exports = FinalCbFirstSuccTask;