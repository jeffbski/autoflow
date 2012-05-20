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
    if (!taskUtil.isIteratingFlow(env.ast)) return flowIteration(env); // if non-iterating, call the flowIteration once and finish

    // if we made it here, then continuing with an iterating flow
    var flowIterStatus = {
      concurrent: 0,     // concurrent iterations
      paused: false,     // true if was paused
      endReached: false, // true when end event was fired
      completeCnt: 0,    // count of iterations that completed
      expectedCnt: 0     // will be incremented as iterates
    };
    var tasks = []; // not using tasks to determine when done, empty array will suffice
    var outTask = taskUtil.createOutTask(env.outTaskDef, env.parsedInput.cb, tasks, env.vCon, env.options, env);
    outTask.isReady = function () { // depends on when iteration is complete
      console.log('in isReady, end, completed, expected', flowIterStatus);
      return (flowIterStatus.endReached && flowIterStatus.completeCnt >= flowIterStatus.expectedCnt);
    };
    var handleError = taskUtil.createErrorHandler(env.vCon, outTask);

    var index = 0;
    var inStream; // set based on type of iterator
    if (env.ast.arrayIterator) {
      var arrayInputParam = env.ast.arrayIterator;
      var arrInput = env.vCon.getVar(arrayInputParam);
      inStream = MemoryStream.createReadStream(arrInput, { useRawData: true }); // no Buffer conversion
    }

    var accum; // set based on type of accumulator specified
    if (env.ast.arrayMapAccumulator) {
      accum = [];
      // place ref to accumulator in original vcon
      var accumOutputParam = taskUtil.hasAccumulator(env.ast);
      env.vCon.setVar(accumOutputParam, accum);
    } else { // no accumulator specified, counter?
      // TODO
    }

    function checkIfDoneExecOutTask() {
      if (!outTask.f) { return; } //stop execution, we already hit an error, f was cleared
      if (outTask.isReady()) {
        console.log('isReady is true, outTask.exec()');
        return outTask.exec();
      }
    }

    inStream.on('error', function (err) {
      var emptyTask = { env: env }; // create empty task since this failed during input stream
      handleError(emptyTask, err);
    }).on('data', function (data) {
      flowIterStatus.expectedCnt += 1;
      flowIterStatus.concurrent += 1;
      if (inStream.pause && env.ast.concurrent && flowIterStatus.concurrent >= env.ast.concurrent) { // if need to throttle, pause
        console.log('pausing concurrent', flowIterStatus.concurrent);
        inStream.pause();
        flowIterStatus.paused = true;
      }
      var iterEnv = Object.create(env); // create pseudo copy
      iterEnv.name = env.name + '_iter_' + index;
      iterEnv.vCon = env.vCon.clone();
      iterEnv.vCon.setVar(':it', data);
      iterEnv.vCon.setVar(':idx', index);
      iterEnv.outTaskDef = Object.create(env.outTaskDef); // create pseudo copy
      iterEnv.outTaskDef.a = [':result', ':idx'];
      iterEnv.parsedInput = Object.create(env.parsedInput); // create pseudo copy
      iterEnv.parsedInput.cb = function (err, result, idx) {
        console.warn('in cbFunc, err, idx, result', err, idx, result);
        if (err) {
          var emptyTask = { env: env }; // create empty task since this failed during input stream
          handleError(emptyTask, err);
        }
        accum[idx] = result;
        flowIterStatus.completeCnt += 1;
        flowIterStatus.concurrent -= 1;
        console.log('preparing to check isReady and call outTask.exec', env.vCon.allValues());
        checkIfDoneExecOutTask();
        if (flowIterStatus.paused && // was paused and
            (!env.ast.concurrent || flowIterStatus.concurrent < env.ast.concurrent)) { // no limit or below limit
          console.log('resuming concurrent', flowIterStatus.concurrent);
          flowIterStatus.paused = false;
          inStream.resume();
        }
      };
      console.log('iterEnv', iterEnv);
      console.log('taskDefs', iterEnv.taskDefs);
      flowIteration(iterEnv);
      index += 1;
    }).on('end', function () {
      console.log('end reached');
      flowIterStatus.endReached = true;
      checkIfDoneExecOutTask();
    });

    return outTask;
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