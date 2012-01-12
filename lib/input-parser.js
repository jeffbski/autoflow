'use strict';

var EventManager = require('./event-manager.js');

var defaultExecOptions = {
  reactExecOptions: true,
  outputStyle: 'cb',
};

var OUTPUT_STYLES = {
  CALLBACK: 'cb',
  NONE: 'none'
};

function isExecOptions(x) { return (x && x.reactExecOptions); }
function execOptionsFilter(x) { return isExecOptions(x); }
function nonExecOptionsFilter(x) { return !isExecOptions(x); }
function mergeExecOptions(accum, options) {
  Object.keys(options).forEach(function (k) { accum[k] = options[k]; });
  return accum;
}

function splitArgs(args, inParams, style) {
  var result = { };
  result.args = inParams.map(function (p) { return args.shift(); }); // take args for input params first
  if (style === OUTPUT_STYLES.CALLBACK && args.length) result.cb = args.shift(); // next take the cb
  result.extra = args; // these remaining were after the callback
  return result;
}
  
function inputParser(inputArgs, ast) {
  var parsedInput = { };
  var execOptionsArr = inputArgs.filter(execOptionsFilter);
  execOptionsArr.unshift(defaultExecOptions);
  parsedInput.options = execOptionsArr.reduce(mergeExecOptions, {});

  var args = inputArgs.filter(nonExecOptionsFilter);
  var splitResult = splitArgs(args, ast.inParams, parsedInput.options.outputStyle); 
  parsedInput.args = splitResult.args;
  parsedInput.cb = splitResult.cb;
  if (splitResult.outputStyle) parsedInput.options.outputStyle = splitResult.outputStyle;
  if (splitResult.extra) parsedInput.extraArgs = splitResult.extra;
  EventManager.global.emit(EventManager.TYPES.EXEC_INPUT_PREPROCESS, parsedInput);  // hook
  return parsedInput;
}

module.exports = inputParser;
module.exports.defaultExecOptions = defaultExecOptions;