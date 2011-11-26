'use strict';

var test = require('tap').test;

var vconutil = require('../lib/vcon.js');

test('createVContext with empty args returns empty vCon', function (t) {
  t.deepEqual(vconutil.createVContext([], []), {}, 'should be empty object');
  t.deepEqual(vconutil.createVContext([], ['a']), {}, 'should be empty object');
  t.end();
});

test('createVContext with more args than params, ignore extra args', function (t) {
  t.deepEqual(vconutil.createVContext([1], []), {}, 'should be empty object');
  t.deepEqual(vconutil.createVContext([1, 2], ['a']), { a: 1 },
              'should be object with one value');
  t.end();
});

test('createVContext sets vCon[paramName] to arg value', function (t) {
  t.deepEqual(vconutil.createVContext([1, 2], ['a', 'b']), { a: 1, b: 2 },
              'should have all values');
  t.end();
});



