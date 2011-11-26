'use strict';

/**
   Create Variable Context using arguments passed in.
   Ignore extra arguments passed in.
 */
function createVContext(args, inParams) {
  return args.reduce(function (vcon, x, idx) { // create vCon start with input args
    var param = inParams[idx];
    if (param) vcon[param] = x;
    return vcon;
  }, {});
}

exports.createVContext = createVContext;