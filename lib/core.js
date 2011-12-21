'use strict';

var EventEmitter = require('events').EventEmitter;

var error = require('./error.js');
var validate = require('./validate.js');
var tskutil = require('./task.js');
var STATUS = require('./status.js');
var VContext = require('./vcon.js');
var FinalCbTask = require('./finalcb-task.js');
var EventManager = require('./event-manager.js');
var inputParser = require('./input-parser.js');
var idGenerator = require('./id.js');

var reactOptions = {
  stackTraceLimitMin: 30  
};

var reactEmitter = EventManager.create(); // the top emitter

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
    inParams: [],
    tasks: [],
    outTask: {},
    locals: {}
  };

  function setAndValidateAST(newAST) { //set AST then validate, ret error[]
    Object.keys(newAST).forEach(function (k) { ast[k] = newAST[k]; }); // copy all properties
    var errors = validate(ast);
    if (!errors.length) tskutil.nameTasks(ast.tasks); //run this so names can be checked in ast
    return errors;
  }

  function exec(arg1, arg2, argN, cb) { // called to execute the flow
    var parsedInput = inputParser(Array.prototype.slice.call(arguments), ast);
    var args = parsedInput.args;
    var cbFinal = parsedInput.cb;
    var extraArgs = parsedInput.extraArgs; // we'll have these if we need them
    var vCon = VContext.create(args, ast.inParams, ast.locals); // create var ctx with in args & locals
    var tasks = ast.tasks.map(tskutil.create);
    var tasksByName = tskutil.nameTasks(tasks); // map names to working tasks
    var outTask = tskutil.createOutTask(ast.outTask, cbFinal, tasks, vCon);
    var handleError = tskutil.createErrorHandler(vCon, outTask);

    function contExec() {
      if (!outTask.f) { return; } //stop execution, we already hit an error, f was cleared
      if (outTask.isReady()) return outTask.exec(); // all tasks done, exec cb, return
      tskutil.findReadyAndExec(vCon, tasks, tasksByName, handleError, contExec);  //exec tasks that ready to run
    }
    
    tasks.forEach(function (t) {
      t.id = idGenerator.createUniqueId();
      t.flowEmitter = flowEmitter;
      if (t.type === 'cb') t.cbFun = tskutil.createCallback(t, handleError, vCon, contExec, flowEmitter);
    }); // create callbacks
    contExec();   // start things off
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
