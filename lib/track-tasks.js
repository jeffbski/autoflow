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

    @example
    var react = require('react');
    react.trackTasks(); // enable task and flow tracking
  */


var react = require('../');  // require('react');

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
