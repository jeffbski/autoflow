'use strict';
/*global define:true */

if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(['util', './sprintf', './base-task', './common'],
       function (util, sprintf, BaseTask, common) {

  function format_error(errmsg, obj) {
    return sprintf('%s - %s', errmsg, util.inspect(obj));
  }

  var REQ = 'streamTask requires f, a, arrIn, out';
  var FN_REQ = 'streamTask requires f to be a function or string';
  var A_REQ = 'streamTask requires a to be an array of string param names';
  var STREAMIN_REQ = 'streamTask requires streamIn to be  string param name';
  var STREAMOUT_REQ = 'streamTask requires streamOut to be  string param name';
  var CB_REQ = 'streamTask requires out to be an array of string param names';

  function StreamTask(taskDef) {
    var self = this;
    Object.keys(taskDef).forEach(function (k) { self[k] = taskDef[k]; });
  }

  StreamTask.prototype = new BaseTask();
  StreamTask.prototype.constructor = StreamTask;

  StreamTask.validate = function (taskDef) {
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
      if (typeof(taskDef.streamIn) !== 'string') {
        errors.push(format_error(STREAMIN_REQ, taskDef));
      }
      if (typeof(taskDef.streamOut) !== 'string') {
        errors.push(format_error(STREAMIN_REQ, taskDef));
      }
      if (! (Array.isArray(taskDef.out) &&
             taskDef.out.every(function (x) { return (typeof(x) === 'string'); }))) {
        errors.push(format_error(CB_REQ, taskDef));
      }
    }
    return errors;
  };


  /**
     Since the stream processing is async and can return out of order
     make sure to queue up out of order results until the lower index
     ones arrive. Once lower ones have caught up can clear the queue.
    */
  StreamTask.prototype.sendOrStoreValue = function (idx, value) {
    var self = this;
    if (idx === self.idx) { // we have just received the next value we need to send
      console.log('sending idx:%d, value:', idx, value, self); //TODO remove
      self.outStream.emit('data', value);
      self.idx += 1;
      if (self.highestIdxInArray >= self.idx) { // we have some values stored
        value = self.arrayIdxValues[self.idx];
        if (typeof(value) !== 'undefined') { // found it
          idx = self.idx;
          console.log('reposting idx:%d, value:', idx, value, self); //TODO remove
          common.nextTick(function () { // call nextTick since js recursion is not recommended with small stack
            StreamTask.prototype.sendOrStoreValue.call(self, idx, value);
          });
          if (self.highestIdxInArray === idx) { // clear whole array
            console.log('clearing array', self); //TODO remove
            self.arrayIdxValues = [];
          } else {
            self.arrayIdxValues[idx] = null; // clear up some storage              
          }
        }
      } else { // check if we have ended
        self.endCheck();
      }
    } else { // we have received something out of order
      console.log('queueing idx:%d, value:%s, self.idx:%d', idx, value, self.idx); //TODO remove
      self.arrayIdxValues[idx] = (typeof(value) !== 'undefined') ? value : null; //upgrade undefined to null
      if (idx > self.highestIdxInArray) self.highestIdxInArray = idx;
    }
  };
  

  

  StreamTask.prototype.prepare = function prepare(handleTaskError, vCon, contExec) {
    var self = this;
    self.inStream = vCon.getVar(self.streamIn);
    self.outStream = vCon.getVar(self.streamOut);
    self.idx = 0; // current index to send next
    self.arrayIdxValues = []; // values that finished out of order
    self.highestIdxInArray = null; // highest index saved in array, after sending, can clear array
    // TODO where can we validate that self.inStream is a stream
    // TODO where can we validate that self.outStream is a stream
    self.cbFun = function (idx, err, result) {
      if (err) { handleTaskError(self, err); return; } //handle error and return, we are done

      self.iterComplete([result, idx]);
      self.sendOrStoreValue(idx, result);
    };
    self.endCheck = function () {
      if (this.isErrored()) return; // already errored
      if (self.inStreamEnded && self.idx === self.inStreamIdx) { // no more to send
        console.log('endCheck true, will end'); //TODO remove
        var objArr = [{ dataCount: self.idx }]; // for debugging
        vCon.saveResults(self.out, objArr);
        self.complete(objArr);
        contExec();
      } else {
        console.log('endCheck false', self); //TODO remove
      }
    };
  };

  StreamTask.prototype.exec = function exec(vCon, handleError, contExec) {
    var self = this;
    try {
      var argsStreamListed = self.a.map(function (k) {
        if (self.streamIn === k) { return sprintf('[stream:%s]', k); }
        return vCon.getVar(k);
      });
      self.start(argsStreamListed); //note the start time, args
      self.inStreamIdx = 0;
      self.inStream.on('data', function (data) {
        if (self.isErrored()) return; // already errored
        var idx = self.inStreamIdx; // make copy
        var args = self.a.map(function (k) { //get args from vCon
          if (self.streamIn === k) { return data; }
          return vCon.getVar(k);
        });
        self.iterStart([data, idx]);
        //console.error('StreamTask.exec.args=', args);
        //console.error('StreamTask.exec.vCon=', vCon);
        var indexedCbFun = self.cbFun.bind(null, idx); // bind idx to first arg
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
        self.inStreamIdx += 1;
      }).on('end', function () {
        self.inStreamEnded = true;
        self.endCheck();
      }).on('error', function (err) {
        self.cbFun.call(null, self.inStreamIdx, err);
      });
    } catch (err) { //catch and handle the task error, calling final cb
      handleError(this, err);
    }    
  };

  return StreamTask;

});  
