'use strict';

var EventEmitter2 = require('eventemitter2').EventEmitter2;

var EVENT_EMITTER2_CONFIG = {
  wildcard: true
};

var TYPES = {
  TASK_BEGIN: 'task.begin',
  TASK_COMPLETE: 'task.complete'
};

/**
   Event manager which emits events up to its parent if exists.
   Allows a hierarchy of emitters, which communicate up the
   chain.
  */
function EventManager() {
}

EventManager.create = function () { return new EventManager(); };

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
  if (this.emitter) this.emitter.emit.apply(this.emitter, arguments);
  if (this.parent && this.parent.isEnabled()) this.parent.emit.apply(this.parent, arguments);
};

/**
   Emit an object augmented with standard fields.
   Copies object and adds standard fields:
    event: event type
    time: current time
  */
EventManager.prototype.emitObject = function (event, object) {
  var evObj = Object.create(object); // create inherited copy version so origin is untouched
  evObj.event = event;     // augment with the event type
  evObj.time = Date.now(); // augument with the time of the event
  this.emit(event, evObj);
};

module.exports = EventManager;
module.exports.TYPES = TYPES;