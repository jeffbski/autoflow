'use strict';

var LAST_RESULTS_KEY = ':LAST_RESULTS';

function VContext() {
}

VContext.prototype.getLastResults = function () { return this.getVar(LAST_RESULTS_KEY); };
VContext.prototype.setLastResults = function (args) { this.setVar(LAST_RESULTS_KEY, args); };

VContext.prototype.getVar = function (name) { //name might be simple or obj.prop, also literals
  var vConValues = this.values;
  if (typeof(name) !== 'string') return name; // literal boolean or number
  name = name.trim();
  if (name === 'true') return true;
  if (name === 'false') return false;
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
VContext.prototype.saveResults = function(paramArr, valuesArr) { // set values for params
  var self = this;
  paramArr.forEach(function (k, idx) { //save values to v context
    self.setVar(k, (valuesArr[idx] !== undefined) ? valuesArr[idx] : null); //upgrade any undefined to null
  });
  this.setLastResults(valuesArr);
}

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
   Create Variable Context using arguments passed in.
   Ignore extra arguments passed in. Locals can be
   passed into seed the VContext otherwise empty {}
   will be used
 */
VContext.create = function (args, inParams, locals) {
  var initValues = {};
  if (locals) Object.keys(locals).forEach(function (k) { initValues[k] = locals[k]; }); // copy over keys
  var vContext = new VContext();
  vContext.values = args.reduce(function (vcon, x, idx) { // create vCon start with input args
    var param = inParams[idx];
    if (param) vcon[param] = x;
    return vcon;
  }, initValues);
  return vContext;
};


module.exports = VContext;