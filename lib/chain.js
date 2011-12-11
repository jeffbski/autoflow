'use strict';

var sprintf = require('sprintf').sprintf;
var core = require('./core.js');
var tutil = require('./task.js');

// err for task type cb is implied and thus optional, but allow for clarity. 
var ERROR_NAMES_RE = /^err$/i;  // first out param matching this is skipped as being the err object

// callback is implied for task type cb is implied and thus optional, but allow for clarity. 
var CALLBACK_NAMES_RE = /^cb$|^callback$/i;  // last in param matching this is skipped as being the cb

var FlowBuilder;

/**
   jQuery-like chain interface for defining flow

   @example
    // normal flow
    var react = require('react');
    var fn = react.chainDefine()
      .in('filename', 'uid', 'outDirname', 'cb')
      .out('err', 'html', 'user', 'bytesWritten')  
      .async(loadUser)          .in('uid')               .out('err', 'user')
      .async(loadFile)          .in('filename')          .out('err', 'filedata')
      .sync(markdown)           .in('filedata')          .out('html')
      .async(prepareDirectory)  .in('outDirname')        .out('err', 'dircreated') 
      .async(writeOutput)       .in('html', 'user')      .out('err', 'bytesWritten')   .after('prepareDirectory')
      .async(loadEmailTemplate) .in()                    .out('err', 'emailmd')
      .sync(markdown)           .in('emailmd')           .out('emailHtml')
      .sync(customizeEmail)     .in('user', 'emailHtml') .out('custEmailHtml')
      .async(deliverEmail)      .in('custEmailHtml')     .out('err', 'deliveredEmail') .after('writeOutput')
      .end();

   @example
    // selectFirst flow
    var fn = chainDefine()
      .selectFirst()
      .in('a', 'b', 'cb')
      .out('err', 'c')
      .async(falpha).in('a', 'b', 'cb').out('err', 'c')
      .sync(fbeta).in('a', 'b').out('c')
      .end();    
*/
function chainDefine() {
  return FlowBuilder.create();
}

function FlowBuilder() {
  this.main = {
    name: null,
    options: {}
  };
  this.tasks = [];
  this.focus = this.main;
}

FlowBuilder.create = function () { return new FlowBuilder(); };

FlowBuilder.prototype.selectFirst = function () {
  this.main.outTaskType = 'finalcbFirst';
  return this;
};

FlowBuilder.prototype.name = function (name) {
  this.focus.name = name;
  return this;
};

FlowBuilder.prototype.in = function (param1, param2, paramN) { 
  var args = Array.prototype.slice.call(arguments);
  if (args.length && this.focus.type !== 'ret') {  // has args and cb or main
    if (args[args.length - 1].match(CALLBACK_NAMES_RE)) args.pop(); // pop off the cb name if specified
  }
  if (this.focus === this.main) this.focus.in = args;
  else this.focus.a = args;   // for tasks
  return this;
};

FlowBuilder.prototype.out = function (param1, param2, paramN) {
  var args = Array.prototype.slice.call(arguments);
  if (args.length && this.focus.type !== 'ret') {  // has args and cb or main
    if (args[0].match(ERROR_NAMES_RE)) args.shift(); // shift off err if specified
  }
  this.focus.out = args;
  return this;
};

FlowBuilder.prototype.options = function (options) {
  var self = this;
  if (this.focus === this.main) {
    Object.keys(options).forEach(function (k) { self.focus.options[k] = options[k]; });
  } else { // task so set options right on task
    Object.keys(options).forEach(function (k) { self.focus[k] = options[k]; });
  }
  return this;
};

FlowBuilder.prototype.async = function (funcOrStrMethod) {
  var task = { f: funcOrStrMethod, type: 'cb' };
  this.tasks.push(task);
  this.focus = task;
  return this;
};

FlowBuilder.prototype.sync = function (funcOrStrMethod) {
  var task = { f: funcOrStrMethod, type: 'ret' };
  this.tasks.push(task);
  this.focus = task;
  return this;
};

FlowBuilder.prototype.after = function (name1, name2, nameN) {
  this.focus.after = Array.prototype.slice.call(arguments);
  return this;
};

/**
   Complete the building of a flow and perform validation
   which throws error if flow is not valid.
  */
FlowBuilder.prototype.end = function end() {
  var reactFn = core();

  if (this.main.outTaskType === 'finalcbFirst') {
    this.tasks = tutil.serializeTasks(this.tasks);
  }

  var ast = {
    inParams: this.main.in || [],
    tasks: this.tasks,
    outTask: {
      a: this.main.out || [],
      type: this.main.outTaskType || 'finalcb'
    }
  };
  if (this.main.name) ast.name = this.main.name;
  var self = this;
  Object.keys(this.main.options).forEach(function (k) { ast[k] = self.main.options[k]; });
  var errors = reactFn.setAndValidateAST(ast);
  if (errors.length) {
    var errorStr = errors.join('\n');
    throw new Error(errorStr);
  }
  return reactFn;
};

module.exports = chainDefine;