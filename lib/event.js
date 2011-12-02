'use strict';

var EventEmitter = require('events').EventEmitter;

var EVENTS = {
  TASK_COMPLETE: 'taskComplete'
};

function create() {
  return new EventEmitter();
}


exports.create = create;
exports.EVENTS = EVENTS;