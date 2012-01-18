'use strict';

var EventEmitter2 = require('eventemitter2').EventEmitter2;

var EVENT_EMITTER2_CONFIG = {
  wildcard: true, // should the event emitter use wildcards.
  delimiter: '.', // the delimiter used to segment namespaces, defaults to `.`.
  maxListeners: 30 // the max number of listeners that can be assigned to an event, defaults to 10.
};

var TYPES = {
  // Flow monitoring events and their params
  AST_DEFINED: 'ast.defined',                      // ast
  FLOW_BEGIN: 'flow.begin',                        // env
  TASK_BEGIN: 'task.begin',                        // task
  TASK_COMPLETE: 'task.complete',                  // task
  TASK_ERRORED: 'task.errored',                    // task
  FLOW_COMPLETE: 'flow.complete',                  // env
  FLOW_ERRORED: 'flow.errored',                    // env

  // Internal Hooks
  EXEC_FLOW_START: 'exec.flow.start',              // env
  EXEC_INPUT_PREPROCESS: 'exec.input.preprocess',  // parsedInput
  EXEC_TASKS_PRECREATE: 'exec.tasks.precreate',    // env
  EXEC_OUTTASK_CREATE: 'exec.outTask.create',      // outTaskOptions
  EXEC_TASK_START: 'exec.task.start',              // task
  EXEC_TASK_COMPLETE: 'exec.task.complete',        // task
  EXEC_TASK_ERRORED: 'exec.task.errored',          // task
  EXEC_FLOW_COMPLETE: 'exec.flow.complete',        // env
  EXEC_FLOW_ERRORED: 'exec.flow.errored'           // env
};

/**
   Event manager which emits events up to its parent if exists.
   Allows a hierarchy of emitters, which communicate up the
   chain.
  */
function EventManager() {
}

EventManager.create = function () { return new EventManager(); };

EventManager.TYPES = TYPES;
EventManager.prototype.TYPES = TYPES;

EventManager.prototype.isEnabled = function () { // if has listener or an ancestor has listener
  return (this.emitter || (this.parent && this.parent.isEnabled()));
};

/**
   Add listener. Wildcard events are allowed like 'foo.*'
   Use '*' to listen to any event
  */
EventManager.prototype.on = function (event, listener) {
  if (!this.emitter) this.emitter = new EventEmitter2(EVENT_EMITTER2_CONFIG);
  if (event === '*') this.emitter.onAny(listener);
  else this.emitter.on(event, listener);
};

EventManager.prototype.emit = function (event, arg1, arg2, argN) {
  if (event === undefined) throw new Error('event is undefined');
  if (this.emitter) this.emitter.emit.apply(this.emitter, arguments);
  if (this.parent && this.parent.isEnabled()) this.parent.emit.apply(this.parent, arguments);
};

EventManager.prototype.removeListener = function (event, listener) {
  if (this.emitter) this.emitter.removeListener.apply(this.emitter, arguments);
};


module.exports = EventManager;
module.exports.global = EventManager.create(); // create one top level emitter