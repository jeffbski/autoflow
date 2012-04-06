'use strict';
/*global define:true */

if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(['util'], function (util) { // TODO replace util.inspect with something portable to browser

  var logEventsMod = { };
  
  /**
     Log events to console.error

     @example
     var react = require('react');
     react.logEvents(); // log all task and flow events on all react functions
     react.logEvents('task.*'); // log all task events on all react functions
     react.logEvents(flowFn); // log all task and flow events on flowFn only
     react.logEvents(flowFn, 'flow.*'); // log all flow events on flowFn only
    */

  var ALL_FLOW_EVENTS = 'flow.*';
  var ALL_TASK_EVENTS = 'task.*';
  var ALL_ITER_EVENTS = 'iter.*';
  var FLOW_RE = /^flow\./;
  var TASK_RE = /^task\./;
  var ITER_RE = /^iter\./;

  function flowLog(obj) {
    /*jshint validthis: true */

    var argsNoCb = obj.args.filter(function (a) { return (typeof(a) !== 'function'); });
    var eventTimeStr;
    
    if (obj.time) {
      var time = new Date();
      time.setTime(obj.time);
      try {
        eventTimeStr = time.toISOString();
      } catch (x) {
        console.error('could not convert flow time to ISOString time:%s err:%s', time, x, obj);
      }      
    }

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
    var argsNoCb = obj.args.filter(function (a) { return (typeof(a) !== 'function'); });
    var eventTimeStr;
    if (obj.time) {
      var time = new Date();
      time.setTime(obj.time);
      try {
        eventTimeStr = time.toISOString();
      } catch (x) {
        console.error('could not convert task time to ISOString time:%s err:%s', time, x, obj);
      }        
    }
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

  function iterLog(obj, iterArgs) {
    /*jshint validthis: true */
    var item = iterArgs[0];
    var idx = iterArgs[1];
    var name = obj.name;
    var args = obj.args;
    console.error('%s: %s:%s \n\tidx: %s\targ: %s\n', this.event, obj.env.name, obj.name, idx, util.inspect(item));
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
    if (!flowFn) throw new Error('flowFn is required');
    if (eventWildcard && eventWildcard !== '*') {
      if (FLOW_RE.test(eventWildcard)) {
        flowFn.events.removeListener(eventWildcard, flowLog);
        flowFn.events.on(eventWildcard, flowLog);
      } else if (TASK_RE.test(eventWildcard)) {
        flowFn.events.removeListener(eventWildcard, taskLog);
        flowFn.events.on(eventWildcard, taskLog);
      } else if (ITER_RE.test(eventWildcard)) {
        flowFn.events.removeListener(eventWildcard, iterLog);
        flowFn.events.on(eventWildcard, iterLog);
      }
    } else { // none provided, use flow.* and task.* and iter.*
      //output events as tasks start and complete
      flowFn.events.removeListener(ALL_FLOW_EVENTS, flowLog);
      flowFn.events.on(ALL_FLOW_EVENTS, flowLog);
      flowFn.events.removeListener(ALL_TASK_EVENTS, taskLog);
      flowFn.events.on(ALL_TASK_EVENTS, taskLog);      
      flowFn.events.removeListener(ALL_ITER_EVENTS, iterLog);
      flowFn.events.on(ALL_ITER_EVENTS, iterLog);      
    }
  }

  logEventsMod.logEvents = logEvents;
  return logEventsMod;

});  