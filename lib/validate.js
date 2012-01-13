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
var MISSING_INPUTS = 'missing or mispelled variable referenced in flow definition: %s';

// match any of our literals true, false, int, float, quoted strings, or is property (has dot), match vcon.js
var LITERAL_OR_PROP_RE = /^(true|false|this|null|\-?[0-9\.]+)$|'|"|\./i;  

var validateInParams, validateTasks, validateOutTask, validateTaskNamesUnique;
var validateLocals, validateOuputsUnique, validateNoMissingNames;

function format_error(errmsg, obj) {
  return sprintf('%s - %s', errmsg, util.inspect(obj));
}

/**
   true if is a literal name
  */
function isLiteralOrProp(name) {  // need to match what is in vcon.js, TODO consolidate?
  return LITERAL_OR_PROP_RE.test(name);
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
    errors = errors.concat(validateNoMissingNames(ast));
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


/**
   validate there are no missing or mispelled param names in any task inputs
   or the final task output

   @return array of errors, or empty array if none
  */
function validateNoMissingNames(ast) {
  var errors = [];
  var names = {};
  if (ast.locals) {
    names = Object.keys(ast.locals).reduce(function (accum, k) { // start with locals
      accum[k] = true;
      return accum;
    }, names);
  }
  ast.inParams.reduce(function (accum, p) {  // add input params
    accum[p] = true;
    return accum;
  }, names);
  ast.tasks.reduce(function (accum, t) { // add task outputs
    return t.out.reduce(function (innerAccum, p) {
      innerAccum[p] = true;
      return innerAccum;
    }, accum);
  }, names);

  // now we have all possible provided vars, check task inputs are accounted for
  ast.tasks.reduce(function (accum, t) {  // for all tasks
    return t.a.reduce(function (innerAccum, p) { // for all in params, except property
      if (!isLiteralOrProp(p) && !names[p]) innerAccum.push(sprintf(MISSING_INPUTS, p)); // add error if missing
      return innerAccum;
    }, accum);
  }, errors);

  // now check the final task outputs
  ast.outTask.a.reduce(function (accum, p) { // for final task out params
    if (!isLiteralOrProp(p) && !names[p]) accum.push(sprintf(MISSING_INPUTS, p)); // add error if missing
    return accum;
  }, errors);
  return errors;  
}

module.exports = validate;