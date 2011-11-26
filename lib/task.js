'use strict';

var util = require('util');
var sprintf = require('sprintf').sprintf;
var CbTask = require('./cb-task.js');
var RetTask = require('./ret-task.js');
var STATUS = require('./status.js');
var error = require('./error.js');

var validateTaskType, validateTask;

var TASK_TYPES = {
  cb: CbTask,
  ret: RetTask
};

var TASKDEF_IS_OBJECT = 'task must be an object';
var TASK_TYPE_SHOULD_MATCH = 'task.type should match one of ' +
  Object.keys(TASK_TYPES).join(', ');

function format_error(errmsg, obj) {
  return sprintf('%s - %s', errmsg, util.inspect(obj));
}

/**
   @returns array of errors for taskDef, could be empty
  */
function validate(taskDef) {
  if (!taskDef || typeof(taskDef) !== 'object') {    
    return [format_error(TASKDEF_IS_OBJECT, taskDef)];
  }
  var errors = [];
  errors = errors.concat(validateTaskType(taskDef));
  errors = errors.concat(validateTask(taskDef));  
  return errors;
}

function validateTaskType(taskDef) {
  var errors = [];
  if (!Object.keys(TASK_TYPES).some(
    function (type) { return (taskDef.type === type); })) {
    errors.push(format_error(TASK_TYPE_SHOULD_MATCH, taskDef));
  }
  return errors;
}

function validateTask(taskDef) {
  var errors = [];
  var taskCons = TASK_TYPES[taskDef.type];
  if (taskCons) {
    errors = errors.concat(taskCons.validate(taskDef));
  }
  return errors;
}

function fName(fn) {
  return (typeof(fn) === 'string') ? fn : fn.name;
}

/**
   Name tasks that are not already named. Prenamed task uniquness validation
   will be done in validate.

   This modifies the tasks with the new names.

   @returns map of names to tasks
  */
function nameTasks(tasks) { //name tasks that are not already named, validation done elsewhere, ret map
  var namesMap = tasks.reduce(function (map, t) {
    if (t.name) { map[t.name] = t; }
    return map;
  }, {});
  tasks.forEach(function (t, idx) {
    if (!t.name) { //not already named
      var name = fName(t.f);
      if (!name || namesMap[name]) {
        name = sprintf('%s_%s', name, idx); //if empty or already used, postfix with _idx
      }
      t.name = name;
      namesMap[name] = t;
    }
  });
  return namesMap;
}

function create(taskDef, cbFun) {
  var TaskConstructor = TASK_TYPES[taskDef.type];
  return new TaskConstructor(taskDef);
}
  
function createCallback(task, handleTaskError, vCon, contExec) {
  return function (err, arg0, arg1, argn) {
    var args = Array.prototype.slice.call(arguments, 1);
    if (err) { handleTaskError(task, err); return; } //handle error and return, we are done

    //no error, save callback args to vCon context, then continue execution
    task.cb.forEach(function (k, idx) { //save cb args to v context
      vCon[k] = (args[idx] !== undefined) ? args[idx] : null; //upgrade any undefined to null
    });
    task.status = STATUS.COMPLETE;
    contExec();
  };
}

function createErrorHandler(vCon, cbFinal) {
  return function handleTaskError(task, err) {
    task.status = STATUS.ERRORED;
    var errWithMeta = error.augmentError(err, {task: task, vcon: vCon});
    cbFinal.call(null, errWithMeta); //call the final callback with the first error hit
  };
}

function execFinalCallback(outTask, cbFinal, vCon) {
  //we are done, call final callback
  var finalArgs = outTask.a.map(function (k) { return vCon[k]; });
  finalArgs.unshift(null); //unshift err=null to front
  cbFinal.apply(null, finalArgs);
}



exports.validate = validate;
exports.nameTasks = nameTasks;
exports.create = create;
exports.createCallback = createCallback;
exports.createErrorHandler = createErrorHandler;
exports.execFinalCallback = execFinalCallback;