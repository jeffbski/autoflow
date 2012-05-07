'use strict';
/*global define:true */

if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(['./task', './id', './memory-stream'], function (taskUtil, idGenerator, MemoryStream) {

  /**
     The flowExecutor handles both normal single iteration flow and iterating flow.
    */
  function flowExecutor(env) {
    if (!isIteratingFlow(env)) return flowIteration(env); // if non-iterating, call the flowIteration once and finish

    // if we made it here, then continuing with an iterating flow
    var tasks = []; // not using tasks to determine when done, empty array will suffice
    var outTask = taskUtil.createOutTask(env.outTaskDef, env.parsedInput.cb, tasks, env.vCon, env.options, env);
    var handleError = taskUtil.createErrorHandler(env.vCon, outTask);

    var inStream; // set based on type of iterator
    if (env.ast.arrayIterator) {
      var arrayInputParam = env.ast.arrayIterator;
      var arrInput = env.vCon.getVar(arrayInputParam);
      inStream = MemoryStream.createReadStream(arrInput, { useRawData: true }); // no Buffer conversion
    }

    inStream.on('error', function (err) {
      var emptyTask = { env: env }; // create empty task since this failed during input stream
      handleError(emptyTask, err);
    }).on('data', function (data) {
      var iterEnv = Object.create(env); // create pseudo copy
      iterEnv.vCon = env.vCon.clone();
    }).on('end', function () {

    });

    return outTask;
  }

  function isIteratingFlow(env) {
    return (env.ast.arrayIterator);
  }

  /**
     A single iteration of the flow. For non-iterating flows this will be only
     executed once. For iterating flows it will execute once for each item.
    */
  function flowIteration(env) {
    var tasks = env.taskDefs.map(taskUtil.create); // create tasks
    var tasksByName = taskUtil.nameTasks(tasks); // map names to working tasks
    var outTask = taskUtil.createOutTask(env.outTaskDef, env.parsedInput.cb, tasks, env.vCon, env.options, env);
    var handleError = taskUtil.createErrorHandler(env.vCon, outTask);

    function contExec() {
      if (!outTask.f) { return; } //stop execution, we already hit an error, f was cleared
      if (outTask.isReady()) { // all tasks done
        return outTask.exec(); // exec cb or endstream, return
      }
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