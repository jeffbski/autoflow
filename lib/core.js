/*global define:true */

if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(['./eventemitter', './error', './validate', './task', './status',
        './vcon', './event-manager', './input-parser', './id', './sprintf'],
       function (EventEmitter, error, validate, taskUtil, STATUS,
                 VContext, EventManager, inputParser, idGenerator, sprintf) {
  'use strict';

  var autoflowOptions = {
    stackTraceLimitMin: 30
  };

  var autoflowEmitter = EventManager.global; // the top emitter

  /**
     merge global autoflow options with parsed options
  */
  function mergeOptions(parsedOptions) {
    return Object.keys(autoflowOptions).reduce(function (accum, k) {
      if (!accum[k]) accum[k] = autoflowOptions[k];
      return accum;
    }, parsedOptions);
  }

  /**
     generate a flow name when one is not provided
  */
  function generateFlowName() {
    return sprintf('flow_%s', idGenerator.createUniqueId());
  }

  /**
     Creates autoflow function which the AST can be manipulated and then
     is ready to be executed. Can be used directly or a DSL can wrap this
     to provide the AST.

     @example
     var autoflow = require('autoflow');
     var fn = autoflow();
     var valid2 = fn.setAndValidateAST({
     name: 'optionalName',
     inParams: ['a', 'b'],
     tasks: [
     { type: 'cb', f: multiply, a: ['a', 'b'], out: ['c'] }
     ],
     outTask: { a: ['c'] }
     });
     console.log(fn.ast); // view
     fn(123, 456, cb);
  */
  function autoflowFactory() {
    if (arguments.length) throw new Error('autoflow() takes no args, check API');

    error.ensureStackTraceLimitSet(autoflowOptions.stackTraceLimitMin);
    var flowEmitter = EventManager.create();
    flowEmitter.parent = autoflowEmitter;

    var ast = {
      name: undefined,
      inParams: [],
      tasks: [],
      outTask: {},
      locals: {}
    };

    function setAndValidateAST(newAST) { //set AST then validate, ret error[]
      Object.keys(newAST).forEach(function (k) { ast[k] = newAST[k]; }); // copy all properties
      var errors = validate(ast);
      if (!errors.length) {
        if (!ast.name) ast.name = generateFlowName();
        taskUtil.nameTasks(ast.tasks); //run this so names can be checked in ast
      }
      if (Object.freeze) { //lets freeze the AST so plugin writers don't accidentally manip the ast
        Object.keys(newAST).forEach(function (k) {
          if (typeof(newAST[k]) === 'object') Object.freeze(newAST[k]);
        });
        Object.freeze(newAST);
      }
      flowEmitter.emit(EventManager.TYPES.AST_DEFINED, ast);
      return errors;
    }

    function exec(arg1, arg2, argN, cb) { // called to execute the flow
      /*jshint validthis: true */
      var args = Array.prototype.slice.call(arguments);
      var env = {
        execId: idGenerator.createUniqueId(),
        args: args,
        ast: ast,
        flowEmitter: flowEmitter
      };
      env.name = ast.name || env.execId;
      flowEmitter.emit(EventManager.TYPES.EXEC_FLOW_START, env);  // hook
      var parsedInput = inputParser(args, ast);
      var vCon = VContext.create(parsedInput.args, ast.inParams, ast.locals, this); // create var ctx with in args & locals

      env.parsedInput = parsedInput;
      env.options = mergeOptions(parsedInput.options);
      env.vCon = vCon;
      env.taskDefs = ast.tasks.slice(); // create copy
      env.outTaskDef = Object.create(ast.outTask); // create copy
      autoflowEmitter.emit(EventManager.TYPES.EXEC_TASKS_PRECREATE, env);  // hook

      var tasks = env.taskDefs.map(taskUtil.create);
      var tasksByName = taskUtil.nameTasks(tasks); // map names to working tasks
      var outTask = taskUtil.createOutTask(env.outTaskDef, parsedInput.cb, tasks, vCon, env.options, env);
      var handleError = taskUtil.createErrorHandler(vCon, outTask);

      function contExec() {
        if (!outTask.f) { return; } //stop execution, we already hit an error, f was cleared
        if (outTask.isReady()) return outTask.exec(); // all tasks done, exec cb, return
        taskUtil.findReadyAndExec(vCon, tasks, tasksByName, handleError, contExec, env);  //exec tasks that ready to run
      }

      tasks.forEach(function (t) {
        t.id = idGenerator.createUniqueId();
        t.env = env;
        if (t.prepare) t.prepare(handleError, vCon, contExec, flowEmitter);
      }); // create callbacks
      contExec();   // start things off
      return outTask.retValue; // could return promise
    }

    var autoflowFn = exec;        // make the exec() the function returned
    autoflowFn.ast  = ast;        // put AST hanging off the fn so it can be inspected
    autoflowFn.setAndValidateAST = setAndValidateAST;   // call to set AST and then validate
    autoflowFn.events = flowEmitter; // used to listen to execution events for this flow
    return autoflowFn;
  }

  autoflowFactory.options = autoflowOptions;   // global autoflow options
  autoflowFactory.events = autoflowEmitter;    // global autoflow emitter
  return autoflowFactory; // module returns autoflowFactory to create a autoflow fn
});