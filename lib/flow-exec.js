'use strict';
/*global define:true */

if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(['./task', './id'], function (taskUtil, idGenerator) {

  /**
     The flowExecutor handles both normal single iteration flow and iterating flow.
    */
  function flowExecutor(env) {
    var flowStream = createFlowStream(env); // returns null if non-iterating
    if (!flowStream) return flowIteration(env); // if non-iterating, call the flowIteration once and finish

    // iterating flow
    var tasks = []; // not using tasks to determine when done, empty array will suffice
    var outTask = taskUtil.createOutTask(env.outTaskDef, env.parsedInput.cb, tasks, env.vCon, env.options, env);

    
     // arrayIterator, lineStreamIterator, streamIterator, regexIterator
     // iterTask.onEach - clone vcon set up iter values, kick off flow
     // iterTask.onError - stop iteration, return error
     // iterTask.onEnd - iteration has ended, once all complete return result
     // iterTask.pause()
     // iterTask.resume()
     // iterTask.destroy()
     // iterTask.destroySoon()
     // iterTask.itemComplete - called when an item has completed

    // ordering buffer - ensures that the items come out in order, buffers early items

    // outStreamHandlers
    // out arrayMapTask - collect each item (in order) into an array, returns array
    // out streamTask - emit items (in order) on outputStream, ends when hits end

    // inIterStream -> throttleStream -> flowIteration -> orderedBufferStream -> outStreamHandler = flowStream

    // nonIteratingFlowStream - hook outTask directly up, invoke flowIteration once
    // iteratingFlowStream - iter -> order -> acum, end, invoke outTask

    // accumulators - single, array, stream, count, event
    
    // flowStream.on('error', handleError);
    // flowStream.on('data', function (data) {
    //   accumulator.push(data);
    // });
    // flowStream.on('end', function () {
    //   // use accumulated, accumulator
    //   outTask.exec();
    // });
    // flowStream.resume(); // kick it off, originally paused
    // throttle max concurrent using 
    
    return outTask;
  }

  function createFlowStream(env) {
    return null; 
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