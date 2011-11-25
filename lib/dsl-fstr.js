'use strict';

var core = require('./core.js');

function dsl() {
  /*
  var args = Array.prototype.slice.call(arguments);
  var inParamsStr = args.shift();
  var taskDefStrs = args.shift();
  var outTaskStr = taskDefStrs.pop();
  */
  
  
  var reactFn = core();
  
  //manipulate AST here
  reactFn.ast.inParams = [];
  reactFn.ast.tasks = [];
  reactFn.ast.outTask = { };
  return reactFn;
}

module.exports = dsl;