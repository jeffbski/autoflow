'use strict';

var core = require('./lib/core.js');

module.exports = require('./lib/dsl.js');  // core + default dsl
module.exports.options = core.options; // global react options
module.exports.events = core.events;   // global react event emitter

// additional interfaces
module.exports.fstrDefine = require('./lib/fstr.js');
module.exports.pcodeDefine = require('./lib/pcode.js');
module.exports.chainDefine = require('./lib/chain.js');