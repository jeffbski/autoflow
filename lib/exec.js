'use strict';
/*global define:true */

if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(['./task', './id'], function (taskUtil, idGenerator) {

  /**
     The flowExecutor handles both normal single iteration flow and iterating flow.
     It uses the env.outTaskDef to determine whether it has an iterator defined,
     and if so creates a task for it and this becomes the only task for the top level
     flow. This iterator task will not end until the iteration is complete or errored.

     If no iterator is found, then the flow just has one single level of iteration
     and it maps tasks and executes.
    */
  function flowExecutor(env) {
    var iterTask = taskUtil.createTaskIter(env); // if is iterator type create, else null //TODO

    // if this is iter type, only create it (it creates real tasks in its loop)
    var tasks = (iterTask) ? [iterTask] : env.taskDefs.map(taskUtil.create); // create tasks
    var tasksByName = taskUtil.nameTasks(tasks); // map names to working tasks
    var outTask = taskUtil.createOutTask(env.outTaskDef, env.parsedInput.cb, tasks, env.vCon, env.options, env);
    var handleError = taskUtil.createErrorHandler(env.vCon, outTask);

    function contExec() {
      if (!outTask.f) { return; } //stop execution, we already hit an error, f was cleared
      if (outTask.isReady()) { // all tasks done
        return outTask.exec(); // exec cb or endstream, return
      }
    }
    taskUtil.findReadyAndExec(env.vCon, tasks, tasksByName, handleError, contExec, env);  //exec tasks that ready to run

    tasks.forEach(function (t) {
      t.id = idGenerator.createUniqueId();
      t.env = env;
      if (t.prepare) t.prepare(handleError, env.vCon, contExec, env.flowEmitter);
    }); // create callbacks
    contExec();   // start things off
    return outTask;
  }

  return flowExecutor;
  
});