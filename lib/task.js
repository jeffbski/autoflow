'use strict';

var util = require('util');
var sprintf = require('sprintf').sprintf;
var CbTask = require('./cb-task.js');
var RetTask = require('./ret-task.js');
var STATUS = require('./status.js');
var error = require('./error.js');
var VContext = require('./vcon.js');
var rEvents = require('./event.js');

var TASK_TYPES = {
  cb: CbTask,
  ret: RetTask
};
function taskTypeKeys() { return Object.keys(TASK_TYPES); }
var LOCAL_FN_MISSING = 'function: %s not found in locals or input params - task[%s]';
var TASKDEF_IS_OBJECT = 'task must be an object';
var NO_TASKS_RUNNING_WONT_COMPLETE = 'no tasks running, flow will not complete';
var TASK_TYPE_SHOULD_MATCH = 'task.type should match one of ' +
  Object.keys(TASK_TYPES).join(', ');

var validateTaskType, validateTask, create;


function format_error(errmsg, obj) {
  return sprintf('%s - %s', errmsg, util.inspect(obj));
}

/**
   guess the missing types from params.
   Augments in place but also returns taskDef.
   If has cb then assume type: 'cb'.
   If has ret then assume type: 'ret'
  */
function setMissingType(taskDef) {
  if (taskDef.type) return taskDef; //already set, return
  if (taskDef.cb) taskDef.type = 'cb';
  else if (taskDef.ret !== undefined) taskDef.type = 'ret';
  return taskDef;
}

/**
   @returns array of errors for taskDef, could be empty
  */
function validate(taskDef) {
  if (!taskDef || typeof(taskDef) !== 'object') {    
    return [format_error(TASKDEF_IS_OBJECT, taskDef)];
  }
  setMissingType(taskDef); 
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

function validateLocalFunctions(inParams, taskDefs, locals) {
  var errors = [];
  function foo() { } //used to mock args as fns for validation check 
  var mock_args = inParams.map(function (p) { return foo; }); //mock args with fns
  var vCon = VContext.create(mock_args, inParams, locals);
  var tasks = taskDefs.map(create);
  tasks.forEach(function (t, idx) {
    if (!t.functionExists(vCon)) {   // error if function doesnt exist AND
      if (!t.isMethodCall()) errors.push(sprintf(LOCAL_FN_MISSING, t.f, idx)); // not method OR
      else {
        var obj = t.getMethodObj(vCon);
        if (obj && obj !== foo) {  // (has parent but not our mock)
          errors.push(sprintf(LOCAL_FN_MISSING, t.f, idx));
        }
      }
    }
  });
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

function create(taskDef) {
  var TaskConstructor = TASK_TYPES[taskDef.type];
  return new TaskConstructor(taskDef);
}
  
function createCallback(task, handleTaskError, vCon, contExec, execEmitter) {
  return function (err, arg0, arg1, argn) {
    var args = Array.prototype.slice.call(arguments, 1);
    if (err) { handleTaskError(task, err); return; } //handle error and return, we are done

    //no error, save callback args to vCon context, then continue execution
    vCon.saveResults(task.cb, args);
    task.complete(args);
    execEmitter.emit(rEvents.EVENTS.TASK_COMPLETE, task.name, args, task);
    contExec();
  };
}

function createErrorHandler(vCon, outTask) {
  return function handleError(task, err) {
    task.status = STATUS.ERRORED;
    var errWithMeta = error.augmentError(err, {task: task, vcon: vCon});
    outTask.exec(errWithMeta); //call the final callback with the first error hit
  };
}

function findTasksReady(vCon, tasks, tasksByName) {
  return tasks.filter(function (t) { return t.isReady(vCon, tasksByName); });
}

function execTasks(tasksReady, vCon, handleError, contExec) {
  tasksReady.forEach(function (t) { t.status = STATUS.READY; }); //set ready first, no double exec
  tasksReady.forEach(function (t) { t.exec(vCon, handleError, contExec); }); 
}

/**
   this will be called if there are no tasks found to run,
   and it will check if there are still tasks running, in which
   case everything is fine. If no tasks are running then
   call handleError since this will never complete.
  */
function checkIfTasksRunning(vCon, tasks, handleError) {
  var tasksRunning = tasks.filter(function (t) { return t.status === STATUS.RUNNING; });
  if (!tasksRunning.length) handleError({}, new Error(NO_TASKS_RUNNING_WONT_COMPLETE));
}

function findReadyAndExec(vCon, tasks, tasksByName, handleError, contExec) {
  var tasksReady = findTasksReady(vCon, tasks, tasksByName);
  if (!tasksReady.length) checkIfTasksRunning(vCon, tasks, handleError); // no tasks to run, check if ok
  execTasks(tasksReady, vCon, handleError, contExec);
}

exports.TASK_TYPES = TASK_TYPES;
exports.taskTypeKeys = taskTypeKeys;
exports.setMissingType = setMissingType;
exports.validate = validate;
exports.validateLocalFunctions = validateLocalFunctions;
exports.nameTasks = nameTasks;
exports.create = create;
exports.createCallback = createCallback;
exports.createErrorHandler = createErrorHandler;
exports.findReadyAndExec = findReadyAndExec;