/*global define:true EventEmitter2:true */

if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(['eventemitter2'], function (EventEmitterMod) {
  'use strict';

  /**
     Abstract the details of getting an EventEmitter
    */

  // EventEmitter doesn't return itself in browser so need to get the global
  // EventEmitter api changed, so accomodate which ever version is available
  var EventEmitter = (EventEmitterMod) ?
    ((EventEmitterMod.EventEmitter2) ? EventEmitterMod.EventEmitter2 : EventEmitterMod) : EventEmitter2;
  return EventEmitter;

});