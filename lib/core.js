'use strict';

var EventEmitter = require('events').EventEmitter;

var error = require('./error.js');
var validate = require('./validate.js');
var tskutil = require('./task.js');
var STATUS = require('./status.js');
var VContext = require('./vcon.js');
var EventManager = require('./event-manager.js');
var inputParser = require('./input-parser.js');
var idGenerator = require('./id.js');
var sprintf = require('sprintf').sprintf;

var reactOptions = {
  stackTraceLimitMin: 30
};

var reactEmitter = EventManager.global; // the top emitter

/**
   merge global react options with parsed options
  */
function mergeOptions(parsedOptions) {
  return Object.keys(reactOptions).reduce(function (accum, k) {
    if (!accum[k]) accum[k] = reactOptions[k];
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
   Creates react function which the AST can be manipulated and then
   is ready to be executed. Can be used directly or a DSL can wrap this
   to provide the AST.

   @example
   var react = require('react');
   var fn = react();
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
function reactFactory() {
  if (arguments.length) throw new Error('react() takes no args, check API');

  error.ensureStackTraceLimitSet(reactOptions.stackTraceLimitMin);
  var flowEmitter = EventManager.create();
  flowEmitter.parent = reactEmitter;

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
      tskutil.nameTasks(ast.tasks); //run this so names can be checked in ast
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
    reactEmitter.emit(EventManager.TYPES.EXEC_TASKS_PRECREATE, env);  // hook
    
    var tasks = env.taskDefs.map(tskutil.create);
    var tasksByName = tskutil.nameTasks(tasks); // map names to working tasks
    var outTask = tskutil.createOutTask(env.outTaskDef, parsedInput.cb, tasks, vCon, env.options, env);
    var handleError = tskutil.createErrorHandler(vCon, outTask);

    function contExec() {
      if (!outTask.f) { return; } //stop execution, we already hit an error, f was cleared
      if (outTask.isReady()) return outTask.exec(); // all tasks done, exec cb, return
      tskutil.findReadyAndExec(vCon, tasks, tasksByName, handleError, contExec, env);  //exec tasks that ready to run
    }

    tasks.forEach(function (t) {
      t.id = idGenerator.createUniqueId();
      t.env = env;
      if (t.prepare) t.prepare(handleError, vCon, contExec, flowEmitter);
    }); // create callbacks
    contExec();   // start things off
    return outTask.retValue; // could return promise
  }

  var reactFn = exec;        // make the exec() the function returned
  reactFn.ast  = ast;        // put AST hanging off the fn so it can be inspected
  reactFn.setAndValidateAST = setAndValidateAST;   // call to set AST and then validate
  reactFn.events = flowEmitter; // used to listen to execution events for this flow
  return reactFn;
}

module.exports = reactFactory;           // module returns reactFactory to create a react fn
module.exports.options = reactOptions;   // global react options
module.exports.events = reactEmitter;    // global react emitter
