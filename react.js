'use strict';

var core = require('./lib/core.js');

module.exports = core;
module.exports.options = core.options;

// interfaces
module.exports.dslfs = require('./lib/dslfs.js');
module.exports.dslp = require('./lib/dslp.js');