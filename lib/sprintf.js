'use strict';
/*global define:true sprint:true */

if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(['sprint'], function (sprintfMod) {

  /**
     Abstract the details of getting a sprintf function
    */
  
  // Sprint doesn't return itself in browser so need to get the global
  var sprintf = (sprintfMod) ?  sprintfMod : sprint;
  return sprintf;
  
});  