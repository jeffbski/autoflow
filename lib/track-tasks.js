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

react.events.on(react.events.TYPES.EXEC_TASK_START, function (taskAndArgs) {
  var task = taskAndArgs.task;
  task.args = taskAndArgs.args;
  task.startTime = Date.now();
  task.flowEmitter.emitObject(react.events.TYPES.TASK_BEGIN, task); //fire public ev
});

react.events.on(react.events.TYPES.EXEC_TASK_COMPLETE, function (taskAndArgs) {
  var task = taskAndArgs.task;
  task.results = taskAndArgs.args;  // save the results
  task.endTime = Date.now();
  task.elapsedTime = task.endTime - task.startTime;
  task.flowEmitter.emitObject(react.events.TYPES.TASK_COMPLETE, task); // fire public ev
});

react.events.on(react.events.TYPES.EXEC_TASK_ERRORED, function (taskAndArgs) {
  
});

module.exports = react;  // return react