'use strict';

var util = require('util');
var sprintf = require('sprintf').sprintf;
var CbTask = require('./cb-task.js');
var RetTask = require('./ret-task.js');

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



exports.validate = validate;