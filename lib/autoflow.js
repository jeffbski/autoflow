/*global define:true */

if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(['./core', './dsl', './track-tasks', './log-events', './promise-resolve', './event-collector'],
       function (core, dsl, trackTasksFn, logEventsMod, resolvePromisesFn, eventCollectorFactory) {
  'use strict';

  var autoflow = dsl; // core + default dsl

  /**
     Enable detection of promises and resolution
    */
  function resolvePromises() {
    resolvePromisesFn(autoflow);
  }

  /**
     Enable tracking of tasks and flow execution, emitting events and
     tracking start, end, elapsed time
    */
  function trackTasks() {
    trackTasksFn(autoflow);
  }

  /**
     If called, load the built-in plugin for log events and invoke

     @param flowFn [function] if not provided uses global autoflow
     @param eventWildcard [string] pattern to log events for
  */
  function logEvents(flowFn, eventWildcard) {
    if (typeof(flowFn) !== 'function') { // only wildcard provided
      eventWildcard = flowFn;
      flowFn = undefined;
    }
    if (!flowFn) flowFn = autoflow; // use global
    trackTasks();
    return logEventsMod.logEvents(flowFn, eventWildcard);
  }

  /**
     Instantiate an event collector
    */
  function createEventCollector() {
    return eventCollectorFactory(autoflow);
  }

  autoflow.options = core.options; // global autoflow options
  autoflow.events = core.events;   // global autoflow event emitter
  autoflow.logEvents = logEvents;  // enable event logging
  autoflow.resolvePromises = resolvePromises; // enable promise resolution
  autoflow.trackTasks = trackTasks; // enable tracking of tasks
  autoflow.createEventCollector = createEventCollector; // create instance of EventCollector
  return autoflow;

});