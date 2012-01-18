'use strict';

/**
   Auto resolve promises passed in as arguments to the flow

    - Detects promises by checking for .then()
    - Create promise name for param (param__promise)
    - moves existing vCon promise into the param__promise
    - creates WhenTask which resolves param__promise into param
  */


var react = require('../');  // require('react');

var PROMISE_SUFFIX = '__promise';  // added to param names that are promises

react.events.on(react.events.TYPES.EXEC_TASKS_PRECREATE, function (env) {
  var vConValues = env.vCon.values;
  var promiseParams = env.ast.inParams.filter(function (p) {
    var value = vConValues[p];
    return (value && typeof(value.then) === 'function');
  });
  promiseParams.forEach(function (p) {
    var promiseName = p + PROMISE_SUFFIX;
    vConValues[promiseName] = vConValues[p];
    vConValues[p] = undefined;
    env.taskDefs.push({
      type: 'when',
      a: [promiseName],
      out: [p]
    });
  });
});

module.exports = react;  // return react