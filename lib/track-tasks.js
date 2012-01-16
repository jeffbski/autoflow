'use strict';

/**
   Track the tasks, start, complete, args, results, elapsed time
   Emits events that can be monitored

    - track start and complete
    - record args each task was called with
    - record results at completion
    - record start, end, and calc elapsed time
    - emits flow.begin with flowEnv
    - emits task.begin with task
    - emits task.complete with task
    - emits flow complete with flowEnv
    - emits flow errored with flowEnv
  */


var react = require('../');  // require('react');

var TASK_EVENTS_RE = /^task\./;
var FLOW_EVENTS_RE = /^flow\./;

/**
   Accumulator to make it easy to capture events

   @example
   var EventCollector = require('react/lib/track-tasks').EventCollector;
   var collector = new EventCollector();
   
   collector.captureGlobal('*'); // capture all react events for all flows

   // OR
   
   collector.capture(flowFn, 'task.'); // capture task events on a flow
   collector.capture(flowFn, 'flow.'); // add capture flow events on a flow

   var events = collector.list();
  */
function EventCollector() {
  this.events = [];
}

/**
   register listener to capture all events
   @param eventId event id or wildcarded id
  */
EventCollector.prototype.captureGlobal = function (eventId) {
  this.capture(react, eventId);
};

/**
   register listener to capture events for a specific flow
   @param flowFn the react flow function or can pass global react
   @param eventId event id or wildcarded id
  */
EventCollector.prototype.capture = function (flowFn, eventId) {
  var emitter = flowFn.events;
  var self = this;
  function accumEvents(obj) {
    var eventObject = {
      event: this.event,
      time: Date.now()
    };
    if (FLOW_EVENTS_RE.test(this.event)) {
      eventObject.env = obj;
    } else if (TASK_EVENTS_RE.test(this.event)) {
      eventObject.task = obj;
    }
    self.events.push(eventObject);      
  }
  emitter.on(eventId, accumEvents);
};

EventCollector.prototype.list = function () {
  return this.events;
};

react.events.on(react.events.TYPES.EXEC_FLOW_START, function (env){
  env.startTime = Date.now();
  env.flowEmitter.emit(react.events.TYPES.FLOW_BEGIN, env); //fire public ev
});

react.events.on(react.events.TYPES.EXEC_TASK_START, function (task) {
  task.startTime = Date.now();
  task.env.flowEmitter.emit(react.events.TYPES.TASK_BEGIN, task); //fire public ev
});

react.events.on(react.events.TYPES.EXEC_TASK_COMPLETE, function (task) {
  task.endTime = Date.now();
  task.elapsedTime = task.endTime - task.startTime;
  task.env.flowEmitter.emit(react.events.TYPES.TASK_COMPLETE, task); // fire public ev
});

react.events.on(react.events.TYPES.EXEC_TASK_ERRORED, function (task) {
  task.endTime = Date.now();
  task.elapsedTime = task.endTime - task.startTime;
  task.env.flowEmitter.emit(react.events.TYPES.TASK_ERRORED, task); // fire public ev
});

react.events.on(react.events.TYPES.EXEC_FLOW_COMPLETE, function (env) {
  env.endTime = Date.now();
  env.elapsedTime = env.endTime - env.startTime;
  env.flowEmitter.emit(react.events.TYPES.FLOW_COMPLETE, env); //fire public ev
});

react.events.on(react.events.TYPES.EXEC_FLOW_ERRORED, function (env) {
  env.endTime = Date.now();
  env.elapsedTime = env.endTime - env.startTime;
  env.flowEmitter.emit(react.events.TYPES.FLOW_ERRORED, env); //fire public ev
});




module.exports = react;  // return react
module.exports.EventCollector = EventCollector;