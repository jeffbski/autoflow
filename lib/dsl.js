'use strict';
/*jshint regexp: false */

var sprintf = require('sprintf').sprintf;
var core = require('./core.js');
var parse = require('./parse.js');
var tutil = require('./task.js');

var INOUT_PARAMS_NO_MATCH = 'params in wrong format, wanted "foo, bar cb -> err, baz" - found: %s';
var EXTRA_TASKARG = 'extra unmatched task arg: %s';

var CB_NAMES_RE = /^cb|callback$/i;  //cb, Cb, CB, callback, Callback
var ERR_NAMES_RE = /^err$/i; // err, ERR, Err, ...

function filterOutTrailingCbParam(args) { // if has trailing cb | callback param, filter it out
  if (args.length && args[args.length - 1].match(CB_NAMES_RE)) args.pop();
  return args;
}

function filterOutLeadingErrParam(args) { // if leading err param, filter it out
  if (args.length && args[0].match(ERR_NAMES_RE)) args.shift();
  return args;
}

var inOutDefParse = {
  regex: /^([^\-]*)(->\s*(.*))?$/i,
  fn: function (m) {
    var inParams = parse.splitTrimFilterArgs(m[1]);
    var lastParam = inParams[inParams.length - 1];
    var type = (lastParam && CB_NAMES_RE.test(lastParam)) ? 'cb' : 'ret';
    var outParams = parse.splitTrimFilterArgs(m[3]);
    return {
      type: type,
      inDef: filterOutTrailingCbParam(inParams),
      outDef: filterOutLeadingErrParam(outParams)
    };
  }
};

function parseInOutParams(str) {
  var objDef = parse.parseStr(str, [inOutDefParse], INOUT_PARAMS_NO_MATCH);
  objDef.inDef = filterOutTrailingCbParam(objDef.inDef);
  return objDef;
}

function parseTasks(arr) {
  var tasks = [];
  var fn, obj, result;
  while (arr.length >= 2) {
    obj = {};
    fn = arr.shift();
    result = parseInOutParams(arr.shift());
    if (typeof(arr[0]) === 'object') obj = arr.shift(); // has options, use as obj
    obj.f = fn;
    obj.a = result.inDef;
    var type = result.type;
    obj.out = result.outDef;
    obj.type = type;
    tasks.push(obj);
  }
  if (arr.length) throw new Error(sprintf(EXTRA_TASKARG, arr[0]));
  return tasks;
}

/**
   Parse the variable arguments into in/out params, tasks, options
  */
function parseVargs(vargs) {
  var inOutParamStr = vargs.shift() || '';
  // if last arg is object, pop it off as options
  var options = (vargs.length && typeof(vargs[vargs.length - 1]) === 'object') ? vargs.pop() : { };
  var taskDefArr = vargs; // rest are for the tasks
  var defObj = {  
    inOutParamStr: inOutParamStr,
    taskDefArr: taskDefArr,
    options: options
  };
  return defObj;
}


function dslDefine(name, arg1, arg2, argN) {
  var reactFn = core();
  var defObj = parseVargs(Array.prototype.slice.call(arguments, 1)); // name, already used 
  var inOutDef = parseInOutParams(defObj.inOutParamStr);
  var ast = {
    name: name,
    inParams: inOutDef.inDef,
    tasks: parseTasks(defObj.taskDefArr),
    outTask: { a: inOutDef.outDef }
  };
  if (defObj.options) Object.keys(defObj.options).forEach(function (k) { ast[k] = defObj.options[k]; });
  var errors = reactFn.setAndValidateAST(ast);
  if (errors.length) {
    var errorStr = errors.join('\n');
    throw new Error(errorStr);
  }
  return reactFn;
}

function selectFirst(name, arg1, arg2, argN) {
  var reactFn = core();
  var defObj = parseVargs(Array.prototype.slice.call(arguments, 1)); // name, already used 
  var inOutDef = parseInOutParams(defObj.inOutParamStr);  
  var tasks = tutil.serializeTasks(parseTasks(defObj.taskDefArr));
  var ast = {
    name: name,
    inParams: inOutDef.inDef,
    tasks: tasks,
    outTask: { type: 'finalcbFirst', a: inOutDef.outDef },
  };
  if (defObj.options) Object.keys(defObj.options).forEach(function (k) { ast[k] = defObj.options[k]; });  
  var errors = reactFn.setAndValidateAST(ast);
  if (errors.length) {
    var errorStr = errors.join('\n');
    throw new Error(errorStr);
  }
  return reactFn;
}

module.exports = dslDefine;
module.exports.selectFirst = selectFirst;