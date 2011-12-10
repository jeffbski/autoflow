'use strict';

var util = require('util');
var sprintf = require('sprintf').sprintf;
var array = require('ensure-array');
var tutil = require('./task.js');

var AST_IS_OBJECT = 'ast must be an object with inParams, tasks, and outTask';
var INPARAMS_ARR_STR = 'ast.inParams must be an array of strings';
var TASKS_ARR = 'ast.tasks must be an array of tasks';
var NAMES_UNIQUE = 'ast.tasks that specify name need to be unique, duplicate:';
var LOCALS_NOTNULL = 'ast.locals should not be null';
var DUP_OUTPUTS = 'multiple tasks output the same param, must be unique. param';

var validateInParams, validateTasks, validateOutTask, validateTaskNamesUnique;
var validateLocals, validateOuputsUnique;

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
  errors = errors.concat(validateTaskNamesUnique(ast.tasks));
  errors = errors.concat(tutil.validateOutTask(ast.outTask));
  errors = errors.concat(validateLocals(ast.locals));
  if (errors.length === 0) { // if no errors do additional validation
    if (ast.outTask.type !== 'finalcbFirst') errors = errors.concat(validateOuputsUnique(ast.tasks));
    errors = errors.concat(tutil.validateLocalFunctions(ast.inParams, ast.tasks, ast.locals));
  }
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
    errors = errors.concat(tutil.validate(t));
  });
  return errors;
}

function validateTaskNamesUnique(tasks) {
  if (!Array.isArray(tasks)) return [];
  var errors = [];
  var namedTasks = tasks.filter(function (t) { return (t.name); });
  var names = namedTasks.map(function (t) { return t.name; });
  names.reduce(function (accum, name) {
    if (accum[name]) errors.push(sprintf('%s %s', NAMES_UNIQUE, name));
    else accum[name] = true;
    return accum;
  }, {});                             
  return errors;
}

function validateLocals(locals) {
  var errors = [];
  if (locals === null) errors.push(LOCALS_NOTNULL);
  return errors;
}

function getOutputParams(taskDef) {
  return array(taskDef.out); //ensure array
}

function validateOuputsUnique(taskDefs) {
  var errors = [];
  taskDefs.reduce(function (accum, t) {
    getOutputParams(t).forEach(function (param) {
      if (accum[param] !== undefined) errors.push(sprintf('%s: %s', DUP_OUTPUTS, param));
      else accum[param] = true;
    });
    return accum;
  }, {});
  return errors;
}

module.exports = validate;