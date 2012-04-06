'use strict';
/*global define:true */

if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([], function () {
  
  var LAST_RESULTS_KEY = ':LAST_RESULTS';

  function VContext() {
    this.values = {};
  }

  VContext.prototype.getLastResults = function () { return this.getVar(LAST_RESULTS_KEY); };
  VContext.prototype.setLastResults = function (args) { this.setVar(LAST_RESULTS_KEY, args); };

  VContext.prototype.getVar = function (name) { //name might be simple or obj.prop, also literals
    /*jshint regexp: false */
    var vConValues = this.values;
    if (typeof(name) !== 'string') return name; // literal boolean or number
    name = name.trim();
    // literal checks need to match what is in validate.js
    if (name === 'true') return true;
    if (name === 'false') return false;
    if (name === 'null') return null;
    if (/^-?[0-9]+$/.test(name)) return parseInt(name, 10); //int
    if (/^-?[0-9.]+$/.test(name)) return parseFloat(name);  //float
    var m = /^("|')([^\1]*)\1$/.exec(name);  //check for quoted string " or '
    if (m) return m[2]; // if is quoted str, return inside of the quotes
    var nameAndProps = name.split('.');
    return nameAndProps.reduce(function (accObj, prop) {
      if (accObj === undefined || accObj === null) return undefined; // prevent exception
      return accObj[prop];
    }, vConValues);   // vCon['foo']['bar']
  };

  /**
     Saves all the results from a task as a unit, also sets special
     variable :LAST_RESULTS which keeps an array of the last values
     which can be used for chaining and testing last results, etc.
  */
  VContext.prototype.saveResults = function (paramArr, valuesArr) { // set values for params
    var self = this;
    paramArr.forEach(function (k, idx) { //save values to v context
      self.setVar(k, (valuesArr[idx] !== undefined) ? valuesArr[idx] : null); //upgrade any undefined to null
    });
    this.setLastResults(valuesArr);
  };

  VContext.prototype.setVar = function (name, value) { //name might be simple or obj.prop
    if (!name) return;  // if name is undefined or null, then discard
    var vConValues = this.values;
    var nameAndProps = name.split('.');
    var lastProp = nameAndProps.pop();
    var obj = nameAndProps.reduce(function (accObj, prop) {
      var o = accObj[prop];
      if (o === undefined || o === null) {  // if doesn't exist create it
        o = accObj[prop] = { };
      }
      return o;
    }, vConValues);   // vCon['foo']['bar']
    obj[lastProp] = value;
  };


  /**
     Retrieve flattened sorted object with all values
     including those of prototypes. Is useful for tests
     and for displaying in output. For performance
     it is better to use .values directly to go against
     the object, but for tests and displaying, good to
     have flat object, so creates new flat {} and returns.

     @return flattened sorted object of all values
    */
  VContext.prototype.allValues = function () {
    /*jshint forin:false */
    var self = this;
    var keys = [];
    for (var k in self.values) { keys.push(k); } // get all enumerable keys from obj and prototypes
    return keys.sort().reduce(function (accum, k) {
      accum[k] = self.values[k];
      return accum;
    }, {});
  };
  
  

  /**
     Create Variable Context using arguments passed in.
     Ignore extra arguments passed in. Locals can be
     passed into seed the VContext otherwise empty {}
     will be used

     @param args - arguments passed in during exec()
     @param inParams - parameter names defined for flow
     @param locals - default set of local values
     @param self used to pass 'this' context in
     @return VContext created for this execution
  */
  VContext.create = function (args, inParams, locals, self) {
    var initValues = (locals) ? Object.create(locals) : {}; // if locals, use as prototype, otherwise new {}
    if (self) initValues['this'] = self;
    var vContext = new VContext();
    vContext.values = args.reduce(function (vcon, x, idx) { // create vCon start with input args
      var param = inParams[idx]; // find param name for this argument, might not be defined
      if (param) vcon[param] = (x !== undefined) ? x : null; // upgrade undefined to null
      return vcon;
    }, initValues);
    return vContext;
  };


  return VContext;

});  