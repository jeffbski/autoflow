'use strict';

var util = require('util');

var reactOptions = {
  debugOutput: false
};

/**
   @example
   var r = react('filename, uid, cb').define(
     loadUser,   'uid               -> err, user',
     loadFile,   'filename          -> err, filedata',
     markdown,   'filedata          -> returns html',
     prepareDirectory, 'outDirname  -> err, dircreated', 
     sendOutput, 'html, user        -> err, html, bytesWritten', {after:prepareDirectory}
   ).callbackDef('err, html, user, bytesWritten');

   r.exec(filename, uid, function(err, html, user, bytesWritten){
     //use html
   });
   
 */

function fName(fn){
  return (typeof(fn) === 'string') ? fn : fn.name;
}

function formatErrorMeta(err){
  if (!err.meta) return;
  var vcon = err.meta.vcon;
  var task = err.meta.task;
  return '\n\n' +
      'Error occurs in Task function: ' + fName(task.f) + '(' + task.a.join(',') + ')\n\n' + 
      'Variable Context: \n' +
      util.inspect(vcon) + '\n\n' +
      'Task Source:\n\n' +
      task.f.toString() + '\n\n'; //TODO need to pretty print function, gets collapsed
}

function augmentError(err, meta){
  if (typeof(err) === 'string' ) { err = new Error(err); } //props will be lost on non-objects
  var origMsg = err.toString();
  err.meta = meta;
  err.toString = function() { return origMsg + formatErrorMeta(err); };
  return err;
}

function splitTrimFilterArgs(commaSepArgs){ //parse 'one, two' into ['one', 'two']
  return commaSepArgs.split( ',' )            //split on commas
    .map(function(s){ return s.trim(); }) //trim
    .filter(function(s){ return (s); });  //filter out empty strings
}

function parseInOutDef(inOutDef){ //'a, b -> err, c, d' into { inDef: ['a','b'], outDef: ['c', 'd'] }
  var match = /^([^-]*)(->)?\s*(er{0,2}\s*,)?(.*)$/.exec(inOutDef);
  if (match) {
    return { inDef: splitTrimFilterArgs(match[1]),
             outDef: splitTrimFilterArgs(match[4]) };
  }
  throw "error parsing in/out def: "+inOutDef;
}

function nameTasks(tasks){ //name tasks that are not already named, validation done elsewhere, ret map
  var namesMap = tasks.reduce(function(map, t){
    if (t.name) { map[t.name] = t; }
    return map; }, {});
  tasks.forEach(function(t, idx){
    if (!t.name) { //not already named
      var name = fName(t.f);
      if (!name || namesMap[name]) name = ''+name+'_'+idx; //if empty or already used, postfix with _idx 
      t.name = name;
      namesMap[name] = t;
    }
  });
  return namesMap;
}

function parseTaskDefs(arrArgs){ // [fun, strArgsCbArgs, optObj]
  var taskDefs = [];
  var CHECK_RETURNS_RE = /^returns?\s+(\w+)\s*;?$/;
  while(arrArgs.length){
    var fn = arrArgs.shift();
    var strArgsCbArgs = arrArgs.shift();
    var optObj = (typeof(arrArgs[0]) === 'object') ? arrArgs.shift() : { };
    if (typeof(strArgsCbArgs) !== 'string') throw "eror parsing taskdef, expected str, got:"+strArgsCbArgs;
    var inOutDef = parseInOutDef(strArgsCbArgs);
    var taskDef = { f:fn, a:inOutDef.inDef, cb:inOutDef.outDef };
    Object.keys(optObj).forEach(function(k){ taskDef[k] = optObj[k]; })
    if (taskDef.after) {
        if (!Array.isArray(taskDef.after)) { taskDef.after = [taskDef.after]; } //ensure arr
        taskDef.after = taskDef.after.map(function(a){ return fName(a); }); 
    }
    var matchReturn = CHECK_RETURNS_RE.exec(taskDef.cb[0]);
    if (matchReturn) { // found return(s) varname, so change this to return type fn
      delete taskDef.cb; taskDef.ret = matchReturn[1]; } // del cb, add ret:varname 
    taskDefs.push( taskDef );
  }
  return taskDefs;
}


function react(inputDef){
  inputDef = Array.prototype.slice.call(arguments).join(', '); //convert 'a', 'b', 'c' into 'a, b, c'
  var reactObj;
  var inOutDef = parseInOutDef(inputDef); 
  var ast = { inputNames: inOutDef.inDef,
              finalOutputNames: inOutDef.outDef, //this might be set later
              taskDefs: [] };                    //set in define()    
  var STATUS = { READY: 'ready',  RUNNING: 'running', ERRORED: 'errored', COMPLETE: 'complete' };

  function define(arg1, arg2, argN){
     ast.taskDefs = ast.taskDefs.concat(parseTaskDefs(Array.prototype.slice.call(arguments)));
     nameTasks(ast.taskDefs); //set names in ast.taskDefs so that ast can be inspected before exec
     return reactObj;
  }

  function callbackDef(argDef){   //define the callback output names
    argDef = Array.prototype.slice.call(arguments).join(', '); //convert 'a', 'b', 'c' into 'a, b, c'
    argDef = ( argDef && /^\s*->/.test(argDef)) ? argDef : '-> '+argDef;  //prefix with -> before parse
    var inOutDef = parseInOutDef(argDef); //should be '-> a,b,c'
    ast.finalOutputNames =  inOutDef.outDef;  
    return reactObj;
  }

  function exec(arg1, arg2, argN){
    var args = Array.prototype.slice.call(arguments);
    var cbFinal = args.pop(); //pop off final callback from end
    var vCon = { }; //create variable context
    args.forEach(function(x, idx){ vCon[ast.inputNames[idx]] = x; });
    var firstError;     //will be set to the err of first task that errors
    var contExec;       //function defined later
    var tasksByName = {}; //set later, by calling nameTasks

    function handleTaskError(task, err){
      task.status = STATUS.ERRORED;
      if (!firstError) { //no prev error, only calling final callback with error once
        var errWithMeta = augmentError(err, {task:task, vcon:vCon});
        firstError = errWithMeta; //save this, stop other tasks from being launched
        cbFinal.call(null, errWithMeta); //call the final callback with the first error hit
      }
    }

    function createCallback(task) {
      return function(err, arg0, arg1, argn){
        var args = Array.prototype.slice.call(arguments,1);
        if(err){ handleTaskError(task, err); return; } //handle error and return, we are done

        //no error, save callback args to vCon context, then continue execution
        task.cb.forEach(function(k, idx){ //save cb args to v context
          vCon[k] = (args[idx] !== undefined) ? args[idx] : null; //upgrade any undefined to null
        });
        task.status = STATUS.COMPLETE;
        if (reactOptions.debugOutput) console.log('in callback: %s cb:', fName(task.f), args, vCon);
        contExec();
      };
    }

    var tasks = ast.taskDefs.map(function(ot){  //create working task copies
      var t = Object.create(ot);
      if(t.cb) t.cbFun = createCallback(t); //if is callback type fn, create callback
      return t;
    });
    tasksByName = nameTasks(tasks); //remap names to exec task copies instead of taskDefs


    function execTask(t){
      t.status = STATUS.RUNNING;
      var args = t.a.map(function(k){ return vCon[k]; }); //get args from vCon
      if (t.cbFun) args.push(t.cbFun); //push custom callback to back if fn uses cb
      if (reactOptions.debugOutput) console.log('starting task: %s', fName(t.f), args);
      try {
        var func;
        var bindObj = null; //start as global object
        if (typeof(t.f) === 'string') { //object method call
          var match = /(\w+)\.(\w+)/.exec(t.f);
          if (match) {
            var objName = match[1];
            var methName = match[2];
            bindObj = vCon[objName];
            func = bindObj[methName];
          }
          if (!func) throw new Error('Object or method not found: '+t.f);
        } else { //function call
          func = t.f;
        }
        var ret = func.apply(bindObj, args);
        if (t.ret) {                      //if non-cb fn/method, 
          vCon[t.ret] = ret;              //  save retval
          t.status = STATUS.COMPLETE;     //  mark complete
          contExec();                     //  continue since no callback to run this
        }                     
      } catch (e) { handleTaskError(t, e); }    //catch and handle the task error, calling final cb
    }      
    
    contExec = function contExec(){
      if (firstError) { return; } //stop execution, we already hit an error
      if (tasks.every(function(t){ return (t.status === STATUS.COMPLETE); })) { //all completed
        //we are done, call final callback
        var finalArgs = ast.finalOutputNames.map(function(k){ return vCon[k]; });
        finalArgs.unshift(null); //unshift err=null to front
        cbFinal.apply(null, finalArgs);
        return;
      }
      var tasksReady = tasks.filter(function(t, idx, arr){ //if we are here then we stil have tasks to run
        return !t.status &&                                                   // filter for not started AND
               t.a.every(function(k){ return (vCon[k] !== undefined); }) &&   // all dep vars defined AND
               (!t.after ||                                                   // (no dep tasks OR 
                t.after.every( function(n){ return tasksByName[n].status === STATUS.COMPLETE; })); //alldone
      });
      tasksReady.forEach(function(t){ t.status = STATUS.READY; }); //set ready before call, no double exec
      tasksReady.forEach(function(t){ execTask(t); });
    };
    contExec(); //now kick off the execution for exec()
  }

  reactObj = {
    define: define,
    callbackDef: callbackDef,
    exec: exec,
    ast: ast,
  };
  
  return reactObj;
}

module.exports.react = react;
module.exports.reactOptions = reactOptions;
