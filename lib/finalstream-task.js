'use strict';
/*global define:true */

if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(['./sprintf', 'util', './status', './event-manager', './memory-stream'],
       function (sprintf, util, STATUS, EventManager, Stream) {

  var OUTTASK_A_REQ = 'ast.outTask.a should be an array of string param names of len <= 1';
  var OUTTASK_STREAM = 'ast.outTask.stream should be a string';         

  function FinalStreamTask(outTaskOptions) {
    /*jshint forin:false */
    var taskDef = outTaskOptions.taskDef;
    var self = this;
    for (var k in taskDef) {
      self[k] = taskDef[k];
    }
    this.f = true; // just set this so core exec
    this.tasks = outTaskOptions.tasks;
    this.vCon = outTaskOptions.vCon;
    this.stream = (taskDef.stream) ? this.vCon.getVar(taskDef.stream) : new Stream(); // if td.stream use
    this.retValue = this.stream;
    this.execOptions = outTaskOptions.execOptions;
    this.env = outTaskOptions.env;
    if (taskDef.a && taskDef.a.length > 1) throw new Error(format_error(OUTTASK_A_REQ, taskDef.a));
  }

  function format_error(errmsg, obj) {
    return sprintf('%s - %s', errmsg, util.inspect(obj));
  }


  FinalStreamTask.validate = function (taskDef) {
    var errors = [];
    if (! (Array.isArray(taskDef.a) && taskDef.a.length <= 1 &&
           taskDef.a.every(function (x) { return (typeof(x) === 'string'); }))) {
      errors.push(format_error(OUTTASK_A_REQ, taskDef));
    }
    if (typeof(taskDef.stream) !== 'undefined' && typeof(taskDef.stream) !== 'string') {
      errors.push(format_error(OUTTASK_STREAM, taskDef));      
    }
    return errors;
  };

  FinalStreamTask.prototype.isReady = function () {
    return (this.tasks.every(function (t) { return (t.status === STATUS.COMPLETE); }));
  };

  FinalStreamTask.prototype.exec = function (err) {
    if (err) {
      this.env.error = err;
      this.env.flowEmitter.emit(EventManager.TYPES.EXEC_FLOW_ERRORED, this.env);
      this.stream.emit('error', err);
      this.stream.end();
      this.stream.destroy();
    } else { // no error, call with args
      var vCon = this.vCon;
      var finalArgs = this.a.map(function (k) { return vCon.getVar(k); });
      if (finalArgs.length) this.stream.write(finalArgs[0].toString());
      this.stream.end();
      this.env.results = finalArgs;
      this.env.flowEmitter.emit(EventManager.TYPES.EXEC_FLOW_COMPLETE, this.env);
    }
  };

  return FinalStreamTask;

});  