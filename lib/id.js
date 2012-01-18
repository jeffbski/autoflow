'use strict';

var startingId = 0;

function createUniqueId() {
  startingId += 1;
  if (startingId === Number.MAX_VALUE) startingId = 0; // if hits this start over //TODO need something better?
  return startingId;
}

exports.createUniqueId = createUniqueId;