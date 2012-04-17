'use strict';
/*global define:true */

if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(['./task', './id'], function (taskUtil, idGenerator) {

  function flowExecutor(env) {
    var tasks = env.taskDefs.map(taskUtil.create);
    var tasksByName = taskUtil.nameTasks(tasks); // map names to working tasks
    var outTask = taskUtil.createOutTask(env.outTaskDef, env.parsedInput.cb, tasks, env.vCon, env.options, env);
    var handleError = taskUtil.createErrorHandler(env.vCon, outTask);

    function contExec() {
      if (!outTask.f) { return; } //stop execution, we already hit an error, f was cleared
      if (outTask.isReady()) return outTask.exec(); // all tasks done, exec cb, return
      taskUtil.findReadyAndExec(env.vCon, tasks, tasksByName, handleError, contExec, env);  //exec tasks that ready to run
    }

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