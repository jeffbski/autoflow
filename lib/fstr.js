'use strict';

var sprintf = require('sprintf').sprintf;
var core = require('./core.js');
var parse = require('./parse.js');
var tutil = require('./task.js');

var INPARAMS_NO_MATCH = 'input params in wrong format, wanted "foo, bar" -  found: %s';
var OUTPARAMS_NO_MATCH = 'output params in wrong format, wanted "foo, bar" - found: %s';
var INOUT_PARAMS_NO_MATCH = 'task params in wrong format, wanted "foo, bar -> err, baz" - found: %s';
var EXTRA_TASKARG = 'extra unmatched task arg: %s';

var inOutDefParse = {
  regex: /^([^-]*)(->)?\s*(er{0,2}\s*,|returns?\s+)?(.*)$/i,
  fn: function (m) {
    var reMatchReturns = /returns?/i;
    return {
      type: (m[3] && m[3].match(reMatchReturns)) ? 'ret' : 'cb',
      inDef: parse.splitTrimFilterArgs(m[1]),
      outDef: parse.splitTrimFilterArgs(m[4])
    };
  }
};

function filterOutTrailingCbParam(args) { // if has trailing cb | callback param, filter it out
  var cbNamesRe = /^cb|callback$/i;  //cb, Cb, CB, callback, Callback
  if (args.length && args[args.length - 1].match(cbNamesRe)) args.pop();
  return args;
}

function parseInParams(str) {
  var objDef = parse.parseStr(str, [inOutDefParse], INPARAMS_NO_MATCH);
  objDef.inDef = filterOutTrailingCbParam(objDef.inDef);
  return objDef;
}

function parseInOutParams(str) {
  var objDef = parse.parseStr(str, [inOutDefParse], INOUT_PARAMS_NO_MATCH);
  objDef.inDef = filterOutTrailingCbParam(objDef.inDef);
  return objDef;
}

function parseOutParams(str) {
  if (str.indexOf('->') === -1) str = '-> ' + str; // prefix so does out err process
  return parse.parseStr(str, [inOutDefParse], OUTPARAMS_NO_MATCH);
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


function fstrDefine(inParamStr, taskDefArr, outParamStr, options) {
  if (!inParamStr) inParamStr = '';
  if (!taskDefArr) taskDefArr = [];
  if (!outParamStr) outParamStr = '';

  var reactFn = core();
  var ast = {
    inParams: parseInParams(inParamStr).inDef,
    tasks: parseTasks(taskDefArr),
    outTask: { a: parseOutParams(outParamStr).outDef }
  };
  if (options) Object.keys(options).forEach(function (k) { ast[k] = options[k]; });
  var errors = reactFn.setAndValidateAST(ast);
  if (errors.length) {
    var errorStr = errors.join('\n');
    throw new Error(errorStr);
  }
  return reactFn;
}

function selectFirst(inParamStr, taskDefArr, outParamStr, options) {
  if (!inParamStr) inParamStr = '';
  if (!taskDefArr) taskDefArr = [];
  if (!outParamStr) outParamStr = '';
  var tasks = tutil.serializeTasks(parseTasks(taskDefArr));

  var reactFn = core();
  var ast = {
    inParams: parseInParams(inParamStr).inDef,
    tasks: tasks,
    outTask: { type: 'finalcbFirst', a: parseOutParams(outParamStr).outDef },
  };
  if (options) Object.keys(options).forEach(function (k) { ast[k] = options[k]; });  
  var errors = reactFn.setAndValidateAST(ast);
  if (errors.length) {
    var errorStr = errors.join('\n');
    throw new Error(errorStr);
  }
  return reactFn;
}

module.exports = fstrDefine;
module.exports.selectFirst = selectFirst;