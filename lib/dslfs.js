'use strict';

var sprintf = require('sprintf').sprintf;
var core = require('./core.js');
var parse = require('./parse.js');

var INPARAMS_NO_MATCH = 'input params in wrong format, wanted "foo, bar" -  found: %s';
var OUTPARAMS_NO_MATCH = 'output params in wrong format, wanted "foo, bar" - found: %s';
var INOUT_PARAMS_NO_MATCH = 'task params in wrong format, wanted "foo, bar -> err, baz" - found: %s';
var EXTRA_TASKARG = 'extra unmatched task arg: %s';

var inOutDefParse = {
  regex: /^([^-]*)(->)?\s*(er{0,2}\s*,|returns?\s+)?(.*)$/,
  fn: function (m) {
    return {
      type: (m[3] && m[3].indexOf('return') !== -1) ? 'ret' : 'cb',
      inDef: parse.splitTrimFilterArgs(m[1]),
      outDef: parse.splitTrimFilterArgs(m[4])
    };
  }
};

function parseInParams(str) {
  return parse.parseStr(str, [inOutDefParse], INPARAMS_NO_MATCH);
}

function parseInOutParams(str) {
  return parse.parseStr(str, [inOutDefParse], INOUT_PARAMS_NO_MATCH);
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
    if (type === 'cb') obj.cb = result.outDef;
    else obj.ret = result.outDef[0]; // ret single param
    obj.type = type;
    tasks.push(obj);
  }
  if (arr.length) throw new Error(sprintf(EXTRA_TASKARG, arr[0]));
  return tasks;
}


function dslfs(inParamStr, taskDefArr, outParamStr, locals) {
  if (!inParamStr) inParamStr = '';
  if (!taskDefArr) taskDefArr = [];
  if (!outParamStr) outParamStr = '';
  if (!locals) locals = {};

  var reactFn = core();
  var errors = reactFn.setAndValidateAST({
    inParams: parseInParams(inParamStr).inDef,
    tasks: parseTasks(taskDefArr),
    outTask: { a: parseOutParams(outParamStr).outDef },
    locals: locals
  });
  if (errors.length) {
    var errorStr = errors.join('\n');
    throw new Error(errorStr);
  }
  return reactFn;
}

module.exports = dslfs;