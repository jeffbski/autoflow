/*global define:true */

if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(['./core', './dsl', './track-tasks', './log-events', './promise-resolve', './event-collector'],
       function (core, dsl, trackTasksFn, logEventsMod, resolvePromisesFn, eventCollectorFactory) {
  'use strict';

  var react = dsl; // core + default dsl

  /**
     Enable detection of promises and resolution
    */
  function resolvePromises() {
    resolvePromisesFn(react);
  }

  /**
     Enable tracking of tasks and flow execution, emitting events and
     tracking start, end, elapsed time
    */
  function trackTasks() {
    trackTasksFn(react);
  }

  /**
     If called, load the built-in plugin for log events and invoke

     @param flowFn [function] if not provided uses global react
     @param eventWildcard [string] pattern to log events for
  */
  function logEvents(flowFn, eventWildcard) {
    if (typeof(flowFn) !== 'function') { // only wildcard provided
      eventWildcard = flowFn;
      flowFn = undefined;
    }
    if (!flowFn) flowFn = react; // use global
    trackTasks();
    return logEventsMod.logEvents(flowFn, eventWildcard);
  }

  /**
     Instantiate an event collector
    */
  function createEventCollector() {
    return eventCollectorFactory(react);
  }

  react.options = core.options; // global react options
  react.events = core.events;   // global react event emitter
  react.logEvents = logEvents;  // enable event logging
  react.resolvePromises = resolvePromises; // enable promise resolution
  react.trackTasks = trackTasks; // enable tracking of tasks
  react.createEventCollector = createEventCollector; // create instance of EventCollector
  return react;

});