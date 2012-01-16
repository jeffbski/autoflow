'use strict';

var EventEmitter2 = require('eventemitter2').EventEmitter2;

var EVENT_EMITTER2_CONFIG = {
  wildcard: true, // should the event emitter use wildcards.
  delimiter: '.', // the delimiter used to segment namespaces, defaults to `.`.
  maxListeners: 30 // the max number of listeners that can be assigned to an event, defaults to 10.
};

var TYPES = {
  // Flow monitoring events and their params
  FLOW_BEGIN: 'flow.begin',                        // flowEnv
  TASK_BEGIN: 'task.begin',                        // task
  TASK_COMPLETE: 'task.complete',                  // task
  FLOW_COMPLETE: 'flow.complete',                  // flowEnv
  FLOW_ERRORED: 'flow.errored',                    // flowEnv

  // Internal Hooks
  EXEC_FLOW_START: 'exec.flow.start',              // ?
  EXEC_INPUT_PREPROCESS: 'exec.input.preprocess',  // parsedInput
  EXEC_TASKS_PRECREATE: 'exec.tasks.precreate',     // taskEnv
  EXEC_OUTTASK_CREATE: 'exec.outTask.create',      // outTaskOptions
  EXEC_TASK_START: 'exec.task.start',              // taskAndArgs
  EXEC_TASK_COMPLETE: 'exec.task.complete',        // taskAndArgs
  EXEC_TASK_ERRORED: 'exec.task.errored',           // taskAndArgs
  EXEC_FLOW_COMPLETE: 'exec.flow.complete',       // ?
  EXEC_FLOW_ERRORED: 'exec.flow.errored'          // ?
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

/**
   Emit an object augmented with standard fields.
   Copies object and adds standard fields:
    event: event type
    time: current time
  */
// EventManager.prototype.emitObject = function (event, object) {
//   var evObj = Object.create(object); // create inherited copy version so origin is untouched
//   evObj.event = event;     // augment with the event type
//   evObj.time = Date.now(); // augument with the time of the event
//   this.emit(event, evObj);
// };

module.exports = EventManager;
module.exports.global = EventManager.create(); // create one top level emitter