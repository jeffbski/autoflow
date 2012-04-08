'use strict';
/*global define:true */

if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(['util', './sprintf', './base-task'], function (util, sprintf, BaseTask) {

  function format_error(errmsg, obj) {
    return sprintf('%s - %s', errmsg, util.inspect(obj));
  }

  var REQ = 'arrayMapTask requires f, a, arrIn, out';
  var FN_REQ = 'arrayMapTask requires f to be a function or string';
  var A_REQ = 'arrayMapTask requires a to be an array of string param names';
  var ARRIN_REQ = 'arrayMapTask requires arrIn to be  string param name';
  var CB_REQ = 'arrayMapTask requires out to be an array of string param names';

  function ArrayMapTask(taskDef) {
    var self = this;
    Object.keys(taskDef).forEach(function (k) { self[k] = taskDef[k]; });
  }

  ArrayMapTask.prototype = new BaseTask();
  ArrayMapTask.prototype.constructor = ArrayMapTask;

  ArrayMapTask.validate = function (taskDef) {
    var errors = [];
    if (!taskDef.f || !taskDef.a || !taskDef.out) {
      errors.push(format_error(REQ, taskDef));
    } else {
      var ftype = typeof(taskDef.f);
      if (! ((taskDef.f instanceof Function) || (ftype === 'string'))) {
        errors.push(format_error(FN_REQ, taskDef));
      }
      if (! (Array.isArray(taskDef.a) &&
             taskDef.a.every(function (x) { return (typeof(x) === 'string'); }))) {
        errors.push(format_error(A_REQ, taskDef));
      }
      if (typeof(taskDef.arrIn) !== 'string') {
        errors.push(format_error(ARRIN_REQ, taskDef));
      }
      if (! (Array.isArray(taskDef.out) &&
             taskDef.out.every(function (x) { return (typeof(x) === 'string'); }))) {
        errors.push(format_error(CB_REQ, taskDef));
      }
    }
    return errors;
  };

  ArrayMapTask.prototype.prepare = function prepare(handleTaskError, vCon, contExec) {
    var self = this;
    self.completeCount = 0;
    self.inArray = vCon.getVar(self.arrIn);
    self.outArray = [];
    self.outArray.length = self.inArray.length; // we need same size
    // TODO where can we validate that self.array is an array?
    self.expectedCount = self.inArray.length;
    self.cbFun = function (idx, err, result) {
      /*jshint validthis:true */
      if (err) { handleTaskError(self, err); return; } //handle error and return, we are done

      self.iterComplete([result, idx]);
      
      self.outArray[idx] = result;
      self.completeCount += 1;
      if (self.completeCount >= self.expectedCount) { // all items are processed
        //no error, save callback args to vCon context, then continue execution
        vCon.saveResults(self.out, [self.outArray]);
        self.complete([self.outArray]);
        contExec();
      }
    };    
  };

  ArrayMapTask.prototype.exec = function exec(vCon, handleError, contExec) {
    var self = this;
    try {
      var argsNoArray = self.a.map(function (k) {
        if (self.arrIn === k) { return sprintf('[arr:%s len:%s]', k, self.inArray.length); }
        return vCon.getVar(k);
      });
      self.start(argsNoArray); //note the start time, args
      self.inArray.forEach(function (inItem, idx) { // for each item in array exec
        if (self.isErrored()) return; // already errored
        var args = self.a.map(function (k) { //get args from vCon
          if (self.arrIn === k) { return inItem; }
          return vCon.getVar(k);
        });
        self.iterStart([inItem, idx]);
        //console.error('ArrayMapTask.exec.args=', args);
        //console.error('ArrayMapTask.exec.vCon=', vCon);
        var indexedCbFun = self.cbFun.bind(null, idx); // bind idx to this
        args.push(indexedCbFun);   // push callback fn on end
        var func = self.f;
        var bindObj = vCon.getVar('self'); //global space or the original this
        if (self.isMethodCall()) { //if method call then reset func and bindObj
          func = vCon.getVar(self.f);
          bindObj = self.getMethodObj(vCon);
        } else if (typeof(func) === 'string') {
          func = vCon.getVar(func); // we want the actual fn from this string
        }
        func.apply(bindObj, args);
      });
    } catch (err) { //catch and handle the task error, calling final cb
      handleError(this, err);
    }    
  };

  return ArrayMapTask;

});  
