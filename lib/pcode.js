'use strict';

var sprintf = require('sprintf').sprintf;
var core = require('./core.js');
var parse = require('./parse.js');
var tutil = require('./task.js');

var INPARAMS_NO_MATCH = 'input params in wrong format, wanted "foo, bar, cb" -  found: %s';
var OUTPARAMS_NO_MATCH = 'output params in wrong format, wanted "cb(err, foo)" - found: %s';
var INOUT_PARAMS_NO_MATCH = 'task params in wrong format, wanted "foo, bar := func(baz, cat, cb) " - found: %s';
var EXTRA_TASKARG = 'extra unmatched task arg: %s';

/**
  Examples:
  var react = require('react');
  
  var locals = { falpha: falpha, fbeta: fbeta, fcharlie: fcharlie };
  var fn = react.pcodeDefine('a, b', [
    'd := fbeta(a, b)',
    'e = fcharlie(a, b)',
    'c := falpha(a, b) when fbeta:done and fcharlie:done',
    'cb(err, c, d, e);'
  ], locals);

  function cb(err, d, e) { }
  fn(10, 20, cb);
 */

function splitAndFilterArgs(commaSepArgs) { // split, trim, filter out empty and (cb or callback)
  var args = parse.splitTrimFilterArgs(commaSepArgs);
  var cbNamesRe = /^cb|callback$/i;  //cb, Cb, CB, callback, Callback
  if (args.length && args[args.length - 1].match(cbNamesRe)) args.pop();
  return args;
}

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
      inDef: splitAndFilterArgs(m[1]),
    };
  }
};

var cbParse = {
  regex: /^\s*(var\s+)?([^:]*)\s*:=\s*([a-zA-Z0-9_\.-]+)\s*\(\s*([^)]*)\)\s*(when\s+([^;]+))?;?\s*$/,
  fn: function (m) {
    var taskDef = {
      type: 'cb',
      f: m[3],
      inDef: (m[4]) ? splitAndFilterArgs(m[4]) : [],
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
      inDef: (m[4]) ? splitAndFilterArgs(m[4]) : [],
      outDef: (m[2]) ? parse.splitTrimFilterArgs(m[2]) : []
    };
    if (m[6]) taskDef.after = extractNamesFromWhenClause(m[6]);
    return taskDef;
  }
};

var finalCbParse = {
  regex: /^\s*(cb|callback)\s*\((er{0,2}\s*,\s*)?([^)]*)\)\s*;?$/i,
  fn: function (m) {
    return {
      outDef: (m[3]) ? parse.splitTrimFilterArgs(m[3]) : []
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
  task.out = result.outDef;
  task.type = type;
  if (result.after) task.after = result.after;
  return task;
}

function parseOutParams(str) {
  if (!str.trim().length) return { outDef: [] };
  return parse.parseStr(str, [finalCbParse], OUTPARAMS_NO_MATCH);
} 

function parseTasks(arr) { return arr.map(parseTask); }


function pcodeDefine(inParamStr, taskStrArr, locals, options) {
  if (!inParamStr) inParamStr = '';
  if (!taskStrArr) taskStrArr = [];
  var outTaskStr = (taskStrArr.length) ? taskStrArr.pop() : '';
  if (!locals) locals = { };

  var reactFn = core();
  var ast = {
    inParams: parseInParams(inParamStr).inDef,
    tasks: parseTasks(taskStrArr),
    outTask: { a: parseOutParams(outTaskStr).outDef },
    locals: locals
  };
  if (options) Object.keys(options).forEach(function (k) { ast[k] = options[k]; });  
  var errors = reactFn.setAndValidateAST(ast);
  if (errors.length) {
    var errorStr = errors.join('\n');
    throw new Error(errorStr);
  }
  return reactFn;
}

function selectFirst(inParamStr, taskStrArr, locals, options) {
  if (!inParamStr) inParamStr = '';
  if (!taskStrArr) taskStrArr = [];
  var outTaskStr = (taskStrArr.length) ? taskStrArr.pop() : '';
  if (!locals) locals = { };
  var tasks = tutil.serializeTasks(parseTasks(taskStrArr));
  
  var reactFn = core();
  var ast = {
    inParams: parseInParams(inParamStr).inDef,
    tasks: tasks,
    outTask: { type: 'finalcbFirst', a: parseOutParams(outTaskStr).outDef },
    locals: locals
  };
  if (options) Object.keys(options).forEach(function (k) { ast[k] = options[k]; });  
  var errors = reactFn.setAndValidateAST(ast);
  if (errors.length) {
    var errorStr = errors.join('\n');
    throw new Error(errorStr);
  }
  return reactFn;
}

module.exports = pcodeDefine;
module.exports.selectFirst = selectFirst;