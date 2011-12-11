'use strict';

var core = require('./lib/core.js');

module.exports = core;
module.exports.options = core.options;

// interfaces
module.exports.fstr = require('./lib/fstr.js');
module.exports.pcode = require('./lib/pcode.js');
module.exports.chainDefine = require('./lib/chain.js');