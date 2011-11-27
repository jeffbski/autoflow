'use strict';

var test = require('tap').test;

var VContext = require('../lib/vcon.js');

test('VContext.create with empty args returns empty vCon', function (t) {
  t.deepEqual(VContext.create([], []).values, {}, 'should be empty object');
  t.deepEqual(VContext.create([], ['a']).values, {}, 'should be empty object');
  t.end();
});

test('VContext.create with more args than params, ignore extra args', function (t) {
  t.deepEqual(VContext.create([1], []).values, {}, 'should be empty object');
  t.deepEqual(VContext.create([1, 2], ['a']).values, { a: 1 },
              'should be object with one value');
  t.end();
});

test('VContext.create sets vCon[paramName] to arg value', function (t) {
  t.deepEqual(VContext.create([1, 2], ['a', 'b']).values, { a: 1, b: 2 },
              'should have all values');
  t.end();
});

test('create with locals is merged with args taking precedence', function (t) {
  var locals = { a: 11, c: 30 };
  t.deepEqual(VContext.create([1, 2], ['a', 'b'], locals).values,
              { a: 1, c: 30, b: 2 }, 'should have merge of values');
  t.end();
});

test('getVar on null returns null', function (t) {
  t.equal(VContext.create([null], ['a']).getVar('a'), null);
  t.equal(VContext.create([{ b: null }], ['a']).getVar('a.b'), null);
  t.end();
});

test('getVar on undefined or null parent returns undefined', function (t) {
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

test('setVar will create objects if needed', function (t) {
  var v = VContext.create([], []);
  v.setVar('foo.bar.baz', 100);
  t.deepEqual(v.values, { foo: { bar: { baz: 100}}});
  t.end();
});

test('simple setVar', function (t) {
  var v = VContext.create([], []);
  v.setVar('foo', 100);
  t.deepEqual(v.values, { foo: 100});
  t.end();
});

test('setVar will not affect other vars', function (t) {
  var v = VContext.create([{ bar: 1}], ['foo']);
  v.setVar('foo.baz', 2);
  t.deepEqual(v.values, { foo: { bar: 1, baz: 2 }});
  t.end();
});

test('setVar with null key, will not set anything', function (t) {
  var v = VContext.create([{ bar: 1}], ['foo']);
  v.setVar(null, 2);
  t.deepEqual(v.values, { foo: { bar: 1 }});
  t.end();  
});

test('setVar with undefined key, will not set anything', function (t) {
  var v = VContext.create([{ bar: 1}], ['foo']);
  v.setVar(undefined, 2);
  t.deepEqual(v.values, { foo: { bar: 1 }});
  t.end();  
});