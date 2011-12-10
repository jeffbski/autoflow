'use strict';

var sprintf = require('sprintf').sprintf;
var core = require('./core.js');

var FlowBuilder;

/**
   jQuery-like chain interface for defining flow

   @example
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
*/
function chainDefine() {
  return FlowBuilder.create();
}

function FlowBuilder() {
  this.main = {};
  this.tasks = [];
  this.focus = this.main;
}

FlowBuilder.create = function () { return new FlowBuilder(); };

FlowBuilder.prototype.in = function (param1, param2, paramN) { 
  this.focus.in = Array.prototype.slice.call(arguments);
  return this;
};

FlowBuilder.prototype.out = function (param1, param2, paramN) { 
  this.focus.out = Array.prototype.slice.call(arguments);
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
function end() {
  var reactFn = core();

  /*
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
  */
  return reactFn;
}

module.exports = chainDefine;