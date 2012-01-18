'use strict';

var util = require('util');
var sprintf = require('sprintf').sprintf;
var array = require('ensure-array');
var CbTask = require('./cb-task.js');
var PromiseTask = require('./promise-task.js');
var RetTask = require('./ret-task.js');
var WhenTask = require('./when-task.js');
var FinalCbTask = require('./finalcb-task.js');
var FinalCbFirstSuccTask = require('./finalcb-first-task.js');
var STATUS = require('./status.js');
var error = require('./error.js');
var VContext = require('./vcon.js');
var EventManager = require('./event-manager.js');

var TASK_TYPES = {
  cb: CbTask,
  ret: RetTask,
  promise: PromiseTask,
  when: WhenTask
};

var DEFAULT_TASK_NAME = 'task_%s';  // for unnamed tasks use task_idx, like task_0

function taskTypeKeys() { return Object.keys(TASK_TYPES); }

var OUT_TASK_TYPES = {
  finalcb: FinalCbTask,   //first task is the default if no type specified in taskDef
  finalcbFirst: FinalCbFirstSuccTask
};
function outTaskTypeKeys() { return Object.keys(OUT_TASK_TYPES); }

var LOCAL_FN_MISSING = 'function: %s not found in locals or input params - task[%s]';
var TASKDEF_IS_OBJECT = 'task must be an object';
var NO_TASKS_RUNNING_WONT_COMPLETE = 'no tasks running, flow will not complete, remaining tasks: %s';
var TASK_TYPE_SHOULD_MATCH = 'task.type should match one of ' +
  Object.keys(TASK_TYPES).join(', ');

var validateTaskType, validateTask, create;


function format_error(errmsg, obj) {
  return sprintf('%s - %s', errmsg, util.inspect(obj));
}

/**
   guess the missing types from params.
   Augments in place but also returns taskDef.
   If not specified then is 'cb'
  */
function setMissingType(taskDef) {
  if (taskDef.type) return taskDef; //already set, return
  taskDef.type = 'cb'; 
  return taskDef;
}

function setMissingOutTaskType(taskDef) {
  if (!taskDef.type) taskDef.type = Object.keys(OUT_TASK_TYPES)[0]; //use first outTask type as default
} 

function ensureAfterArrStrings(taskDef) { // convert any fn to str, and make sure is array
  if (!taskDef.after) return;
  var afterArr = array(taskDef.after);  // ensure is array, null becomes []
  afterArr = afterArr.map(function (a) { return (typeof(a) === 'function') ? a.name : a; });
  taskDef.after = afterArr;
}

/**
   @returns array of errors for taskDef, could be empty
  */
function validate(taskDef) {
  if (!taskDef || typeof(taskDef) !== 'object') {    
    return [format_error(TASKDEF_IS_OBJECT, taskDef)];
  }
  setMissingType(taskDef);
  ensureAfterArrStrings(taskDef);
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

function validateOutTask(taskDef) {
  var errors = [];
  setMissingOutTaskType(taskDef);
  var taskCons = OUT_TASK_TYPES[taskDef.type];
  errors = errors.concat(taskCons.validate(taskDef));
  return errors;  
}


function validateLocalFunctions(inParams, taskDefs, locals) {
  var errors = [];
  function foo() { } //used to mock args as fns for validation check 
  var mock_args = inParams.map(function (p) { return foo; }); //mock args with fns
  var vCon = VContext.create(mock_args, inParams, locals);
  var tasks = taskDefs.map(create);
  var tasksWFunctions = tasks.filter(function (t) { return (t.type !== 'when'); }); // non-when tasks need f
  tasksWFunctions.forEach(function (t, idx) {
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
  if (typeof(fn) === 'function') {
    return fn.name;
  }
  return (fn) ? fn : '';
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
      if (!name) name = sprintf(DEFAULT_TASK_NAME, idx);
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

function createOutTask(taskDef, cbFunc, tasks, vCon, execOptions, env) {
  setMissingOutTaskType(taskDef);
  var outTaskOptions = {
    taskDef: taskDef,
    cbFunc: cbFunc,
    tasks: tasks,
    vCon: vCon,
    execOptions: execOptions,
    env: env,
    TaskConstructor: OUT_TASK_TYPES[taskDef.type]
  };
  EventManager.global.emit(EventManager.TYPES.EXEC_OUTTASK_CREATE, outTaskOptions); // hook
  var TaskConstructor = outTaskOptions.TaskConstructor;  // hook could have changed
  return new TaskConstructor(outTaskOptions);
}
  
function createErrorHandler(vCon, outTask) {
  return function handleError(task, err) {
    task.status = STATUS.ERRORED;
    task.error = err;
    outTask.env.currentTask = task;
    outTask.env.flowEmitter.emit(EventManager.TYPES.EXEC_TASK_ERRORED, task);
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
   and it will check if there are still tasks running or ready
   (which means they will be running shortly), in which
   case everything is fine. If no tasks are running then
   call handleError since this will never complete.
  */
function checkIfTasksRunning(vCon, tasks, handleError, env) {
  var tasksRunning = tasks.filter(function (t) {
    return (t.status === STATUS.RUNNING || t.status === STATUS.READY);
  });
  if (!tasksRunning.length) {
    var remainingTasks = tasks.filter(function (t) { return (!t.status); });
    var remainingTNames = remainingTasks.map(function (t) { return t.name; });
    var errMsg = sprintf(NO_TASKS_RUNNING_WONT_COMPLETE, remainingTNames.join(', '));
    var emptyTask = { env: env };
    handleError(emptyTask, new Error(errMsg));
  }
}

function findReadyAndExec(vCon, tasks, tasksByName, handleError, contExec, env) {
  var tasksReady = findTasksReady(vCon, tasks, tasksByName);
  if (!tasksReady.length) checkIfTasksRunning(vCon, tasks, handleError, env); // no tasks to run, check if ok
  execTasks(tasksReady, vCon, handleError, contExec);
}

function serializeTasks(tasks) { // conveniently set after for each task idx > 0
  nameTasks(tasks);
  tasks.forEach(function (t, idx, arr) { if (idx !== 0) t.after = [arr[idx - 1].name]; }); 
  return tasks;
}

exports.serializeTasks = serializeTasks;

exports.TASK_TYPES = TASK_TYPES;
exports.taskTypeKeys = taskTypeKeys;
exports.OUT_TASK_TYPES = OUT_TASK_TYPES;
exports.outTaskTypeKeys = outTaskTypeKeys;
exports.setMissingType = setMissingType;
exports.validate = validate;
exports.validateOutTask = validateOutTask;
exports.validateLocalFunctions = validateLocalFunctions;
exports.nameTasks = nameTasks;
exports.create = create;
exports.createOutTask = createOutTask;
exports.createErrorHandler = createErrorHandler;
exports.findReadyAndExec = findReadyAndExec;