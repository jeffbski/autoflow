'use strict';

var util = require('util');
var sprintf = require('sprintf').sprintf;
var task = require('./task.js');

var AST_IS_OBJECT = 'ast must be an object with inParams, tasks, and outTask';
var INPARAMS_ARR_STR = 'ast.inParams must be an array of strings';
var TASKS_ARR = 'ast.tasks must be an array of tasks';
var OUTTASK_A_REQ = 'ast.outTask.a should be an array of string param names';

var validateInParams, validateTasks, validateOutTask;

function format_error(errmsg, obj) {
  return sprintf('%s - %s', errmsg, util.inspect(obj));
}

/**
   validate the AST return Errors
   @example
   var validate = require('./validate');
   var errors = validate(ast);
   @returns array of errors, could be empty
  */
function validate(ast) {
  if (!ast || !ast.inParams || !ast.tasks || !ast.outTask) return [AST_IS_OBJECT];
  var errors = [];
  errors = errors.concat(validateInParams(ast.inParams));
  errors = errors.concat(validateTasks(ast.tasks));
  errors = errors.concat(validateOutTask(ast.outTask));
  return errors;
}

/**
   @returns array of errors, could be empty
 */
function validateInParams(inParams) {
  if (!Array.isArray(inParams) ||
      !inParams.every(function (x) { return (typeof(x) === 'string'); })) {
    return [INPARAMS_ARR_STR];
  }
  return [];
}

/**
   @returns array of errors, could be empty
 */
function validateTasks(tasks) {
  if (!Array.isArray(tasks)) return [TASKS_ARR];
  var errors = [];
  tasks.forEach(function (t) {
    errors = errors.concat(task.validate(t));
  });
  return errors;
}

/**
   @returns array of errors, could be empty
 */
function validateOutTask(taskDef) {
  var errors = [];
  if (! (Array.isArray(taskDef.a) &&
         taskDef.a.every(function (x) { return (typeof(x) === 'string'); }))) {
    errors.push(format_error(OUTTASK_A_REQ, taskDef));
  }
  return errors;
}

module.exports = validate;