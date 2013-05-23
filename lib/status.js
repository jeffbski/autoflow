/*global define:true */

if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([], function () {
  'use strict';

  var STATUS = { READY: 'ready',  RUNNING: 'running', ERRORED: 'errored', COMPLETE: 'complete' };

  return STATUS;

});