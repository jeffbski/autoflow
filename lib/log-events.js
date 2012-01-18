'use strict';

/**
   Log events to console.error

   @example
   var react = require('react');
   react.logEvents(); // log all task and flow events on all react functions
   react.logEvents('task.*'); // log all task events on all react functions
   react.logEvents(flowFn); // log all task and flow events on flowFn only
   react.logEvents(flowFn, 'flow.*'); // log all flow events on flowFn only
  */

var util = require('util'); // TODO replace inspect with something portable to browser

var react = require('../'); // require('react');
react.trackTasks(); // enable task and flow tracking

var ALL_FLOW_EVENTS = 'flow.*';
var ALL_TASK_EVENTS = 'task.*';
var FLOW_RE = /^flow\./;

function flowLog(obj) {
  /*jshint validthis: true */
  var time = new Date();
  time.setTime(obj.time);
  var argsNoCb = obj.args.filter(function (a) { return (typeof(a) !== 'function'); });
  var eventTimeStr = time.toISOString();
  if (this.event === 'flow.complete') {
    var env = obj; 
    console.error('%s: %s \tmsecs: %s \n\targs: %s \n\tresults: %s\n',
                  this.event, env.name, env.elapsedTime, util.inspect(argsNoCb), util.inspect(env.results));   
  } else {
    var name = obj.name;
    var args = obj.args;
    console.error('%s: %s \n\targs: %s\n', this.event, name, util.inspect(argsNoCb));
  }    
}

function taskLog(obj) {
  /*jshint validthis: true */
  var time = new Date();
  time.setTime(obj.time);
  var argsNoCb = obj.args.filter(function (a) { return (typeof(a) !== 'function'); });
  var eventTimeStr = time.toISOString();
  if (this.event === 'task.complete') {
    var task = obj;
    console.error('%s: %s:%s \tmsecs: %s \n\targs: %s \n\tresults: %s\n',
                  this.event, task.env.name, task.name, task.elapsedTime, util.inspect(argsNoCb), util.inspect(task.results));
  } else {
    var name = obj.name;
    var args = obj.args;
    console.error('%s: %s:%s \n\targs: %s\n', this.event, obj.env.name, obj.name, util.inspect(argsNoCb));
  }
  
}

/**
   Log flow and task events for a flowFn or all of react.
   If called multiple times, remove previous listener (if any) before
   adding.
   
   @example
   var react = require('react');
   react.logEvents(flowFn, eventWildcard); //log events on flowfn matching wildcard
   
   @param flowFn Flow function or global react object
   @param eventWildcard wildcarded event type, if not provided use flow.* and task.*
  */
function logEvents(flowFn, eventWildcard) {
  if (!flowFn) flowFn = react; // use global 
  if (eventWildcard && eventWildcard !== '*') {
    var logFn = (FLOW_RE.test(eventWildcard)) ? flowLog : taskLog;
    flowFn.events.removeListener(eventWildcard, logFn);
    flowFn.events.on(eventWildcard, logFn);
  } else { // none provided, use flow.* and task.*
    //output events as tasks start and complete
    flowFn.events.removeListener(ALL_FLOW_EVENTS, flowLog);
    flowFn.events.on(ALL_FLOW_EVENTS, flowLog);
    flowFn.events.removeListener(ALL_TASK_EVENTS, taskLog);
    flowFn.events.on(ALL_TASK_EVENTS, taskLog);      
  }
}

module.exports = react;
module.exports.logEvents = logEvents;