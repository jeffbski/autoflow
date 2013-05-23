/*global define:true */

if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(['./sprintf'], function (sprintf) {
  'use strict';

  function splitTrimFilterArgs(commaSepArgs) { //parse 'one, two' into ['one', 'two']
    if (!commaSepArgs) return [];
    return commaSepArgs.split(',')            //split on commas
      .map(function (s) { return s.trim(); }) //trim
      .filter(function (s) { return (s); });  //filter out empty strings
  }

  /**
     @param patternFn regex + fn or splitStr + fn
  */
  function parseReduce(accum, patternFn) {
    if (typeof(accum) !== 'string') return accum; // already matched
    var m = (patternFn.regex) ? patternFn.regex.exec(accum) : accum.split(patternFn.splitStr);
    if (m) return patternFn.fn(m, accum); // pass in matches and origStr, return result obj
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

  return {
    splitTrimFilterArgs: splitTrimFilterArgs,
    parseStr: parseStr
  };

});
