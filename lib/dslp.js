'use strict';

var sprintf = require('sprintf').sprintf;
var core = require('./core.js');
var parse = require('./parse.js');

var INPARAMS_NO_MATCH = 'input params in wrong format, wanted "foo, bar, cb" -  found: %s';
var OUTPARAMS_NO_MATCH = 'output params in wrong format, wanted "cb(err, foo)" - found: %s';
var INOUT_PARAMS_NO_MATCH = 'task params in wrong format, wanted "foo, bar := func(baz, cat, cb) " - found: %s';
var EXTRA_TASKARG = 'extra unmatched task arg: %s';

/**
  Examples:

  var locals = { falpha: falpha, fbeta: fbeta, fcharlie: fcharlie };
  var fn = dslp('a, b', [
    'd := fbeta(a, b)',
    'e = fcharlie(a, b)',
    'c := falpha(a, b) when fbeta:done and fcharlie:done',
    'cb(err, c, d, e);'
  ], locals);

  fn(10, 20, cb);
 */


function extractNamesFromWhenClause(str) { //given 'foo:done and bar.baz:done' return ['foo', 'bar.baz']
  var reSplit = /\s+and\s+/i;
  var reDone = /^([^:]+):done$/i;
  var names = str.split(reSplit).map(function (x) {
    x = x.trim();
    var m = x.match(reDone); // if foo:done, we'll use foo
    return (m) ? m[1] : x; 
  });
  return names;
}

var inParse = {
  regex: /^(.*)$/, 
  fn: function (m) {
    return {
      inDef: parse.splitTrimFilterArgs(m[1]),
    };
  }
};

var cbParse = {
  regex: /^\s*(var\s+)?([^:]*)\s*:=\s*([a-zA-Z0-9_\.-]+)\s*\(\s*([^)]*)\)\s*(when\s+([^;]+))?;?\s*$/,
  fn: function (m) {
    var taskDef = {
      type: 'cb',
      f: m[3],
      inDef: (m[4]) ? parse.splitTrimFilterArgs(m[4]) : [],
      outDef: (m[2]) ? parse.splitTrimFilterArgs(m[2]) : []
    };
    if (m[6]) taskDef.after = extractNamesFromWhenClause(m[6]);
    return taskDef;
  }
};

var retParse = {
  regex: /^\s*(var\s+)?([^:]*)\s*=\s*([a-zA-Z0-9_\.-]+)\s*\(\s*([^)]*)\)\s*(when\s+([^;]+))?;?\s*$/,
  fn: function (m) {
    var taskDef = {
      type: 'ret',
      f: m[3],
      inDef: (m[4]) ? parse.splitTrimFilterArgs(m[4]) : [],
      outDef: (m[2]) ? parse.splitTrimFilterArgs(m[2]) : []
    };
    if (m[6]) taskDef.after = extractNamesFromWhenClause(m[6]);
    return taskDef;
  }
};

var finalCbParse = {
  regex: /^\s*cb\s*\((er{0,2}\s*,\s*)?([^)]*)\)\s*;?$/,
  fn: function (m) {
    return {
      outDef: (m[2]) ? parse.splitTrimFilterArgs(m[2]) : []
    };
  }
};

function parseInParams(str) {
  return parse.parseStr(str, [inParse], INPARAMS_NO_MATCH);
}

function parseTask(str) {
  var result = parse.parseStr(str, [cbParse, retParse], INOUT_PARAMS_NO_MATCH);
  var type = result.type;
  var task = {
    f: result.f,
    a: result.inDef
  };
  if (type === 'cb') task.cb = result.outDef;
  else task.ret = result.outDef[0];
  task.type = type;
  if (result.after) task.after = result.after;
  return task;
}

function parseOutParams(str) {
  if (!str.trim().length) return { outDef: [] };
  return parse.parseStr(str, [finalCbParse], OUTPARAMS_NO_MATCH);
} 

function parseTasks(arr) { return arr.map(parseTask); }


function dslp(inParamStr, taskStrArr, locals) {
  if (!inParamStr) inParamStr = '';
  if (!taskStrArr) taskStrArr = [];
  var outTaskStr = (taskStrArr.length) ? taskStrArr.pop() : '';
  if (!locals) locals = { };

  var reactFn = core();
  var errors = reactFn.setAndValidateAST({
    inParams: parseInParams(inParamStr).inDef,
    tasks: parseTasks(taskStrArr),
    outTask: { a: parseOutParams(outTaskStr).outDef },
    locals: locals
  });
  if (errors.length) {
    var errorStr = errors.join('\n');
    throw new Error(errorStr);
  }
  return reactFn;
}

module.exports = dslp;