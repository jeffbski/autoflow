'use strict';

var startingId = 0;

function createUniqueId() {
  startingId += 1;
  return startingId;
}

exports.createUniqueId = createUniqueId;