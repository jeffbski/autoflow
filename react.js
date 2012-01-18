'use strict';

var core = require('./lib/core.js');

/**
   If called, load the built-in plugin for log events and invoke

   @param flowFn [function] if not provided uses global react
   @param eventWildcard [string] pattern to log events for
  */
function logEvents(flowFn, eventWildcard) {
  var logEventsMod = require('./lib/log-events');
  if (!eventWildcard && typeof(flowFn) === 'string') { // only wildcard provided
    eventWildcard = flowFn;
    flowFn = undefined;
  } 
  return logEventsMod.logEvents(flowFn, eventWildcard);
}

/**
   Enable detection of promises and resolution
  */
function resolvePromises() {
  require('./lib/promise-resolve');
}

/**
   Enable tracking of tasks and flow execution, emitting events and
   tracking start, end, elapsed time
  */
function trackTasks() {
  require('./lib/track-tasks');
}

module.exports = require('./lib/dsl.js');  // core + default dsl
module.exports.options = core.options; // global react options
module.exports.events = core.events;   // global react event emitter
module.exports.logEvents = logEvents;  // enable event logging
module.exports.resolvePromises = resolvePromises; // enable promise resolution
module.exports.trackTasks = trackTasks; // enable tracking of tasks