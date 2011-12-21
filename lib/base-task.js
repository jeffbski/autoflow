'use strict';

var array = require('ensure-array');
var STATUS = require('./status.js');
var EventManager = require('./event-manager.js');

function BaseTask() {
}

/**
   Getter Fn to retrieveAn array of the output param names for this task.
  */
BaseTask.prototype.getOutParams = function () {
  return array(this.out); // ensure array
};

BaseTask.prototype.isComplete = function () {
  return (this.status === STATUS.COMPLETE);
};

BaseTask.prototype.start = function (args) { // mark task as started with args and note time
  this.args = args;
  this.startTime = Date.now();
  if (this.flowEmitter) this.flowEmitter.emitObject(EventManager.TYPES.TASK_BEGIN, this);
};

BaseTask.prototype.complete = function (args) { //args that were used are available
  this.results = args;  // save the results
  this.endTime = Date.now();
  this.elapsedTime = this.endTime - this.startTime;
  if (this.flowEmitter) this.flowEmitter.emitObject(EventManager.TYPES.TASK_COMPLETE, this);
  this.status = STATUS.COMPLETE;
};

BaseTask.prototype.functionExists = function (vCon) {
  var fn = this.f;
  if (!fn) return false;
  if (fn instanceof Function) return true;
  if (typeof(fn) === 'string') {
    var f = vCon.getVar(fn);  // fn/method by string
    if (f && f instanceof Function) return true;
  }
  return false;
};

BaseTask.prototype.areAllDepArgsDefined = function (vCon) {
  return this.a.every(function (k) { return (vCon.getVar(k) !== undefined); });
};

BaseTask.prototype.depTasksAreDone = function (tasksByName) {
  return (!this.after || !this.after.length || // no dep tasks OR
          this.after.every(function (n) { return tasksByName[n].isComplete(); }));  //all done
};

function isObjProperty(str) { return (str.indexOf('.') !== -1); }

/**
   check that obj parent is def and not null so writing to obj.prop
   will not fail. ex: 'b.c' checks that b is def and not null.
   Also returns true if not obj.prop but simple var ex: 'b'.
   Tasks will implement outParentsExist() passing each out str
   to this if they want to do this check.
  */
BaseTask.prototype.parentExists = function (objPropStr, vCon) {
  if (!isObjProperty(objPropStr)) return true; // NOT obj prop, just simple arg, ret true
  var nameAndProps = objPropStr.split('.');
  nameAndProps.pop(); // pop off final prop
  var parent = nameAndProps.reduce(function (accObj, prop) {
    if (accObj === undefined || accObj === null) return undefined; // prevent exception
    return accObj[prop];
  }, vCon.values);   // vCon['foo']['bar']
  return (parent !== undefined && parent !== null);
};

/**
   If params are obj property writes make sure the dst objects
   are defined and not null. cb: ['b.c'] -> b is def and not null.
   If null is specified then param is valid and will be ignored.
   @returns true if all obj prop parents are def and non null
  */
BaseTask.prototype.outParentsExist = function (vCon) {
  var self = this;
  return this.getOutParams().every(function (x) {
    if (x === null) return true;
    return self.parentExists(x, vCon);
  });
};

BaseTask.prototype.isReady = function (vCon, tasksByName) {
  return !this.status &&                  // not started AND
  this.functionExists(vCon) &&            // function/method exists AND
  this.areAllDepArgsDefined(vCon) &&      // all dep vars defined AND
  this.depTasksAreDone(tasksByName) &&    // all dep tasks are done AND
  (!this.outParentsExist ||               // (task does not implement outParentsExist method OR
   this.outParentsExist(vCon));          //  output parents exists (for obj property writes)
};

BaseTask.prototype.isMethodCall = function () {
  return (typeof(this.f) === 'string' && /^.*\..*$/.test(this.f));  //str contains .
};

BaseTask.prototype.getMethodObj =  function (vCon) { //obj.prop.prop2, returns obj.prop or undefined
  var name = this.f;
  if (!name) return undefined;
  var nameAndProps = name.split('.');
  nameAndProps.pop(); // pop off last one
  if (!nameAndProps.length) return undefined;
  var result = nameAndProps.reduce(function (accObj, prop) {
    if (accObj === undefined || accObj === null) return undefined; // prevent exception
    return accObj[prop];
  }, vCon.values); // vCon['foo']['bar']
  return result;
};

module.exports = BaseTask;