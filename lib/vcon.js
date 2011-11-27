'use strict';

function VContext() {
}

VContext.prototype.getVar = function (name) { //name might be simple or obj.prop, also literals
  var vCon = this.values;
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
  }, vCon);   // vCon['foo']['bar']
};


/**
   Create Variable Context using arguments passed in.
   Ignore extra arguments passed in.
 */
VContext.create = function (args, inParams) {
  var vContext = new VContext();
  vContext.values = args.reduce(function (vcon, x, idx) { // create vCon start with input args
    var param = inParams[idx];
    if (param) vcon[param] = x;
    return vcon;
  }, {});
  return vContext;
};


module.exports = VContext;