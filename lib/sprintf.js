/*global define:true sprint:true */

if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(['util'], function (util) {
  'use strict';

  /**
     Abstract the details of getting a sprintf function.
     Currently using the simple format capabilities of node's util.format
    */

  var sprintf = util.format;
  return sprintf;

});