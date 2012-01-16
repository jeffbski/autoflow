'use strict';

/**
   Log events to console.error

   @example
   var react = require('react');
   require('react/lib/log-events').logEvent(react);
  */

var react = require('../lib/track-tasks');  // require('react/lib/track-tasks'); // turn on tracking

/**
   Log flow and task events for a flowFn or all of react
   
   @example
   var react = require('react');
   require('react/lib/log-events').logEvents(flowFn); // pass flowFn or react
   
   @param flowFn Flow function or global react object
  */
function logEvents(flowFn) {
  //output events as tasks start and complete
  flowFn.events.on('flow.*', function (obj) {
    /*jshint validthis: true */
    var time = new Date();
    time.setTime(obj.time);
      var argsNoCb = obj.args.filter(function (a) { return (typeof(a) !== 'function'); });
      var eventTimeStr = time.toISOString();
    if (this.event === 'flow.complete') {
      var env = obj; 
      console.error('%s: %s \tmsecs:(%s) \n\targs:(%s) \n\tresults:(%s)\n',
                    this.event, env.name, env.elapsedTime, argsNoCb, env.results);   
    } else {
      var name = obj.name;
      var args = obj.args;
      console.error('%s: %s \n\targs:(%s)\n', this.event, name, argsNoCb);
    }
  });

  flowFn.events.on('task.*', function (obj) {
    /*jshint validthis: true */
    var time = new Date();
    time.setTime(obj.time);
    var argsNoCb = obj.args.filter(function (a) { return (typeof(a) !== 'function'); });
    var eventTimeStr = time.toISOString();
    if (this.event === 'task.complete') {
      var task = obj;
      console.error('%s: %s \tmsecs:(%s) \n\targs:(%s) \n\tresults:(%s)\n',
                    this.event, task.name, task.elapsedTime, argsNoCb, task.results);
    } else {
      var name = obj.name;
      var args = obj.args;
      console.error('%s: %s \n\targs:(%s)\n', this.event, name, argsNoCb);
    }
  });
}


module.exports = react;
module.exports.logEvents = logEvents;