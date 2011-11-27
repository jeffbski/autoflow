'use strict';

var test = require('tap').test;

var VContext = require('../lib/vcon.js');

test('createVContext with empty args returns empty vCon', function (t) {
  t.deepEqual(VContext.create([], []).values, {}, 'should be empty object');
  t.deepEqual(VContext.create([], ['a']).values, {}, 'should be empty object');
  t.end();
});

test('createVContext with more args than params, ignore extra args', function (t) {
  t.deepEqual(VContext.create([1], []).values, {}, 'should be empty object');
  t.deepEqual(VContext.create([1, 2], ['a']).values, { a: 1 },
              'should be object with one value');
  t.end();
});

test('createVContext sets vCon[paramName] to arg value', function (t) {
  t.deepEqual(VContext.create([1, 2], ['a', 'b']).values, { a: 1, b: 2 },
              'should have all values');
  t.end();
});

test('getVar on undefined or nulls returns undefined', function (t) {
  t.equal(VContext.create([], []).getVar('a'), undefined);
  t.equal(VContext.create([], ['a']).getVar('a'), undefined);
  t.equal(VContext.create([], ['a']).getVar('a.b'), undefined);
  t.equal(VContext.create([], ['a']).getVar('a.b.c'), undefined);
  t.equal(VContext.create([null], ['a']).getVar('a.b'), undefined);
  t.equal(VContext.create([null], ['a']).getVar('a.b.c'), undefined);
  t.equal(VContext.create([1], ['a']).getVar('a.b'), undefined);
  t.equal(VContext.create([1], ['a']).getVar('a.b.c'), undefined);
  t.end();
});

test('simple getVar returns existing value', function (t) {
  t.equal(VContext.create([null], ['a']).getVar('a'), null);
  t.equal(VContext.create([1], ['a']).getVar('a'), 1);
  t.equal(VContext.create([true], ['a']).getVar('a'), true);
  t.equal(VContext.create(['banana'], ['a']).getVar('a'), 'banana');
  t.end();
});

test('getVar on literals returns the literal', function (t) {
  t.equal(VContext.create([], []).getVar(true), true);
  t.equal(VContext.create([], []).getVar(false), false);
  t.equal(VContext.create([], []).getVar(-100), -100);
  t.equal(VContext.create([], []).getVar(100), 100);
  t.equal(VContext.create([], []).getVar(123.4), 123.4);
  t.equal(VContext.create([], []).getVar(-987.6), -987.6);
  t.equal(VContext.create([], []).getVar('"foo"'), 'foo');
  t.equal(VContext.create([], []).getVar("'foo'"), 'foo');
  t.end();
});

test('getVar for property returns the property', function (t) {
  var o = { b: 100};
  t.equal(VContext.create([o], ['a']).getVar('a.b'), 100);
  o = { b: { c: 200 }};
  t.equal(VContext.create([o], ['a']).getVar('a.b.c'), 200);
  t.end();  
});
