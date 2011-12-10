'use strict';

var sprintf = require('sprintf').sprintf;

function splitTrimFilterArgs(commaSepArgs) { //parse 'one, two' into ['one', 'two']
  return commaSepArgs.split(',')            //split on commas
    .map(function (s) { return s.trim(); }) //trim
    .filter(function (s) { return (s); });  //filter out empty strings
}

function parseReduce(accum, regexFn) {
  if (typeof(accum) !== 'string') return accum; // already matched
  var m = regexFn.regex.exec(accum);
  if (m) return regexFn.fn(m); // return result obj
  return accum; // no match, return str, will try next matcher
}

function parseStr(str, parseMatchers, errStr) {
  var result = parseMatchers.reduce(parseReduce, str);
  if (typeof(result) !== 'string') { // matched
    return result;
  } else { // no match
    throw new Error(sprintf(errStr, str));
  }  
}

exports.splitTrimFilterArgs = splitTrimFilterArgs;
exports.parseStr = parseStr;
