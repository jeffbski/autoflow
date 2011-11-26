'use strict';

var error = require('./error.js');
var validate = require('./validate.js');
var tskutil = require('./task.js');
var STATUS = require('./status.js');
var vconutil = require('./vcon.js');

var reactOptions = {
  stackTraceLimitMin: 30  
};


/**
   Creates react function which the AST can be manipulated and then
   is ready to be executed. Can be used directly or a DSL can wrap this
   to provide the AST.

   @example
   var react = require('react');
   react.stackTraceLimitMin = 20;
   var fn = react();
   var valid2 = fn.setAndValidateAST({
     inParams: ['a', 'b'],
     tasks: [
      { type: 'cb', f: multiply, a: ['a', 'b'], cb: ['c'] }
     ],
    outTask: { a: ['c'] }
   });
   console.log(fn.ast); // view
   fn(123, 456, cb);
 */
function reactFactory() {
  error.ensureStackTraceLimitSet(reactOptions.stackTraceLimitMin);

  var ast = {
    inParams: [],
    tasks: [],
    outTask: {}
  };

  function setAndValidateAST(newAST) { //set AST then validate, ret error[]
    ast.inParams = newAST.inParams;
    ast.tasks = newAST.tasks;
    ast.outTask = newAST.outTask;
    var errors = validate(ast);
    if (!errors.length) tskutil.nameTasks(ast.tasks); //run this so names can be checked in ast
    return errors;
  }

  function exec(arg1, arg2, argN, cb) { // called to execute the flow
    var args = Array.prototype.slice.call(arguments);
    var cbFinal = args.pop(); // pop off final callback from end
    var vCon = vconutil.createVContext(args, ast.inParams); // create vCon with input args
    var tasksByName = {}; //set later, by calling nameTasks
    var tasks = ast.tasks.map(tskutil.create);
    var handleTaskError = tskutil.createErrorHandler(vCon, cbFinal);

    //TODO make sure to clear handleTaskError after calling it, so doesn't call twice
    function contExec() {
      if (!handleTaskError) { return; } //stop execution, we already hit an error
      if (tasks.every(function(t){ return (t.status === STATUS.COMPLETE); })) { //all completed
        tskutil.execFinalCallback(ast.outTask, cbFinal, vCon);
        return;
      }
      var tasksReady = tasks.filter(isTaskReady);     //if we are here then we stil have tasks to run
      tasksReady.forEach(function(t){ t.status = STATUS.READY; }); //set ready first, no double exec
      tasksReady.forEach(function(t){ execTask(t); });
    }
    
    tasks.forEach(function (t) {
      if (t.cb) t.cbFun = tskutil.createCallback(t, handleTaskError, vCon, contExec);
    }); // create callbacks
    tasksByName = tskutil.nameTasks(tasks); // map names to working tasks
    contExec();   // start things off
  }

  var reactFn = exec;        // make the exec() the function returned
  reactFn.ast  = ast;        // put AST hanging off the fn so it can be inspected
  reactFn.setAndValidateAST = setAndValidateAST;   // call to set AST and then validate
  return reactFn;
}

module.exports = reactFactory;           // module returns reactFactory to create a react fn
module.exports.options = reactOptions;   // global react options

