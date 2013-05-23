/*global react:true VContext:true */

if (typeof(chai) === 'undefined') {
  var chai = require('chai');
}

if (typeof(react) === 'undefined') {
  var react = require('../'); //require('react');
}

if (typeof(VContext) === 'undefined') {
  var VContext = require('../lib/vcon.js');
}

(function () {
  'use strict';

  var t = chai.assert;

  /**
     Testing Variable Context
  */

  suite('vcon');

  test('VContext.create with empty args returns empty vCon', function (done) {
    t.deepEqual(VContext.create([], []).values, {}, 'should be empty object');
    t.deepEqual(VContext.create([], ['a']).values, {}, 'should be empty object');
    done();
  });

  test('VContext.create with more args than params, ignore extra args', function (done) {
    t.deepEqual(VContext.create([1], []).values, {}, 'should be empty object');
    t.deepEqual(VContext.create([1, 2], ['a']).values, { a: 1 },
                'should be object with one value');
    done();
  });

  test('VContext.create sets vCon[paramName] to arg value', function (done) {
    t.deepEqual(VContext.create([1, 2], ['a', 'b']).values, { a: 1, b: 2 },
                'should have all values');
    done();
  });

  test('create with locals is merged with args taking precedence', function (done) {
    var locals = { a: 11, c: 30 };
    t.deepEqual(VContext.create([1, 2], ['a', 'b'], locals).values,
                { a: 1, c: 30, b: 2 }, 'should have merge of values');
    done();
  });

  test('create with locals should not modify original locals', function (done) {
    var locals = { a: 11, c: 30 };
    t.deepEqual(VContext.create([1, 2], ['a', 'b'], locals).values,
                { a: 1, c: 30, b: 2 }, 'should have merge of values');
    t.deepEqual(locals, { a: 11, c: 30 }, 'should not modify original locals object');
    done();
  });

  test('getVar on null returns null', function (done) {
    t.equal(VContext.create([null], ['a']).getVar('a'), null);
    t.equal(VContext.create([{ b: null }], ['a']).getVar('a.b'), null);
    done();
  });

  test('getVar on undefined or null parent returns undefined', function (done) {
    t.equal(VContext.create([], []).getVar('a'), undefined);
    t.equal(VContext.create([], ['a']).getVar('a'), undefined);
    t.equal(VContext.create([], ['a']).getVar('a.b'), undefined);
    t.equal(VContext.create([], ['a']).getVar('a.b.c'), undefined);
    t.equal(VContext.create([null], ['a']).getVar('a.b'), undefined);
    t.equal(VContext.create([null], ['a']).getVar('a.b.c'), undefined);
    t.equal(VContext.create([1], ['a']).getVar('a.b'), undefined);
    t.equal(VContext.create([1], ['a']).getVar('a.b.c'), undefined);
    done();
  });

  test('simple getVar returns existing value', function (done) {
    t.equal(VContext.create([null], ['a']).getVar('a'), null);
    t.equal(VContext.create([1], ['a']).getVar('a'), 1);
    t.equal(VContext.create([true], ['a']).getVar('a'), true);
    t.equal(VContext.create(['banana'], ['a']).getVar('a'), 'banana');
    done();
  });

  test('getVar on literals returns the literal', function (done) {
    t.equal(VContext.create([], []).getVar(true), true);
    t.equal(VContext.create([], []).getVar(false), false);
    t.equal(VContext.create([], []).getVar(null), null);
    t.equal(VContext.create([], []).getVar('true'), true);
    t.equal(VContext.create([], []).getVar('false'), false);
    t.equal(VContext.create([], []).getVar('null'), null);
    t.equal(VContext.create([], []).getVar(-100), -100);
    t.equal(VContext.create([], []).getVar(100), 100);
    t.equal(VContext.create([], []).getVar(123.4), 123.4);
    t.equal(VContext.create([], []).getVar(-987.6), -987.6);
    t.equal(VContext.create([], []).getVar('-100'), -100);
    t.equal(VContext.create([], []).getVar('100'), 100);
    t.equal(VContext.create([], []).getVar('123.4'), 123.4);
    t.equal(VContext.create([], []).getVar('-987.6'), -987.6);
    t.equal(VContext.create([], []).getVar('"foo"'), 'foo');
    t.equal(VContext.create([], []).getVar("'foo'"), 'foo');
    t.equal(VContext.create([], []).getVar("'foo.bar'"), 'foo.bar');
    t.equal(VContext.create([], []).getVar("'foo-bar'"), 'foo-bar');
    t.equal(VContext.create([], []).getVar("'foo-bar.json'"), 'foo-bar.json');
    t.equal(VContext.create([], []).getVar('"foo-bar.json"'), 'foo-bar.json');
    t.deepEqual(VContext.create([], [], null, { a: 1}).getVar('this'), { a: 1});
    done();
  });

  test('getVar for property returns the property', function (done) {
    var o = { b: 100};
    t.equal(VContext.create([o], ['a']).getVar('a.b'), 100);
    o = { b: { c: 200 }};
    t.equal(VContext.create([o], ['a']).getVar('a.b.c'), 200);
    done();
  });

  test('setVar will create objects if needed', function (done) {
    var v = VContext.create([], []);
    v.setVar('foo.bar.baz', 100);
    t.deepEqual(v.values, { foo: { bar: { baz: 100}}});
    done();
  });

  test('simple setVar', function (done) {
    var v = VContext.create([], []);
    v.setVar('foo', 100);
    t.deepEqual(v.values, { foo: 100});
    done();
  });

  test('setVar will not affect other vars', function (done) {
    var v = VContext.create([{ bar: 1}], ['foo']);
    v.setVar('foo.baz', 2);
    t.deepEqual(v.values, { foo: { bar: 1, baz: 2 }});
    done();
  });

  test('setVar with null key, will not set anything', function (done) {
    var v = VContext.create([{ bar: 1}], ['foo']);
    v.setVar(null, 2);
    t.deepEqual(v.values, { foo: { bar: 1 }});
    done();
  });

  test('setVar with undefined key, will not set anything', function (done) {
    var v = VContext.create([{ bar: 1}], ['foo']);
    v.setVar(undefined, 2);
    t.deepEqual(v.values, { foo: { bar: 1 }});
    done();
  });

  test('saveResults will set values for params and :LAST_RESULTS', function (done) {
    var v = VContext.create([], []);
    v.saveResults(['foo', 'bar', 'cat'], [1, 'hello', null]);
    t.deepEqual(v.values, { foo: 1, bar: 'hello', cat: null,
                            ':LAST_RESULTS': [1, 'hello', null] });
    done();
  });

  test('saveResults set :LAST_RESULT w/all even params is short', function (done) {
    var v = VContext.create([], []);
    v.saveResults(['foo'], [1, 'hello', null]);
    t.deepEqual(v.values, { foo: 1,
                            ':LAST_RESULTS': [1, 'hello', null] });
    done();
  });

  test('saveResults will set values for params and :LAST_RESULTS', function (done) {
    var v = VContext.create([], []);
    v.saveResults(['foo', 'bar', 'cat'], [1, 'hello', null]);
    t.deepEqual(v.values, { foo: 1, bar: 'hello', cat: null,
                            ':LAST_RESULTS': [1, 'hello', null] });
    done();
  });

  test('saveResults upgrades undefined to null, but :LAST_RESULT is exact', function (done) {
    var v = VContext.create([], []);
    v.saveResults(['foo', 'bar', 'baz'], [1, undefined]);
    t.deepEqual(v.values, { foo: 1, bar: null, baz: null,
                            ':LAST_RESULTS': [1, undefined] });
    done();
  });

  test('saveResults null params skips saving, :LAST_RESULT is exact', function (done) {
    var v = VContext.create([], []);
    v.saveResults(['foo', null], [1, 20]); //skip second param
    t.deepEqual(v.values, { foo: 1, ':LAST_RESULTS': [1, 20] });
    done();
  });

}());