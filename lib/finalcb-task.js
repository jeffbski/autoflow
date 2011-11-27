'use strict';

var STATUS = require('./status.js');

function FinalCbTask(taskDef, cbFunc, tasks, vCon) {
  var self = this;
  Object.keys(taskDef).forEach(function (k) { self[k] = taskDef[k]; });
  this.f = cbFunc;
  this.tasks = tasks;
  this.vCon = vCon;
}

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