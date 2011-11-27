'use strict';

var STATUS = require('./status.js');

function BaseTask() {
}

BaseTask.prototype.isComplete = function () {
  return (this.status === STATUS.COMPLETE);
};

BaseTask.prototype.functionExists = function (vCon) {
  return (this.f &&                          // f exists AND
          (this.f instanceof Function ||     // is a function OR
           (this.isMethodCall() && this.getMethodObj(vCon) && vCon.getVar(this.f))));  // has method
};

BaseTask.prototype.areAllDepArgsDefined = function (vCon) {
  return this.a.every(function (k) { return (vCon.getVar(k) !== undefined); });
};

BaseTask.prototype.depTasksAreDone = function (tasksByName) {
  return (!this.after || // no dep tasks OR
          this.after.every(function (n) { return tasksByName[n].isComplete(); }));  //all done
};

BaseTask.prototype.isReady = function (vCon, tasksByName) {
  return !this.status &&                  // not started AND
  this.functionExists(vCon) &&            // function/method exists AND
  this.areAllDepArgsDefined(vCon) &&      // all dep vars defined AND
  this.depTasksAreDone(tasksByName);      // all dep tasks are done
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
  return nameAndProps.reduce(function (accObj, prop) {
    if (accObj === undefined || accObj === null) return undefined; // prevent exception
    return accObj[prop];
  }, vCon.values); // vCon['foo']['bar']
};

module.exports = BaseTask;