'use strict';

var core = require('./lib/core.js');

module.exports = core;
module.exports.options = core.options;
module.exports.events = core.events;   // top level emitter

// interfaces
module.exports.fstrDefine = require('./lib/fstr.js');
module.exports.pcodeDefine = require('./lib/pcode.js');
module.exports.chainDefine = require('./lib/chain.js');