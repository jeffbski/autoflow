'use strict';
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

  var t = chai.assert;

  /**
     Testing Variable Context 
  */

  suite('vcon');

  test('vContext.allValues() should return object with all values sorted', function () {
    var vcon = new VContext(); // normally use create
    var fooValues = { b: 2, c: 'foo', a: 1 };
    vcon.values = fooValues;
    var expected = { a: 1, b: 2, c: 'foo'};
    t.deepEqual(vcon.allValues(), expected);
  });

  test('vContext.allValues should return flattened object with all values sorted', function () {
    var vcon = new VContext(); // normally use create
    var fooValues = { b: 2, c: 'foo', a: 1 };
    var barValues = Object.create(fooValues); // use fooValues as prototype
    barValues.a = 10;
    barValues.c = 'bar';
    barValues.d = true;
    vcon.values = barValues;
    var expected = { a: 10, b: 2, c: 'bar', d: true };
    t.deepEqual(vcon.allValues(), expected, 'should contain flat merge of all prototype values');
  });

  test('VContext.create with empty args returns empty vCon', function () {
    t.deepEqual(VContext.create([], []).allValues(), {}, 'should be empty object');
    t.deepEqual(VContext.create([], ['a']).allValues(), {}, 'should be empty object');
  });

  test('VContext.create with more args than params, ignore extra args', function () {
    t.deepEqual(VContext.create([1], []).allValues(), {}, 'should be empty object');
    t.deepEqual(VContext.create([1, 2], ['a']).allValues(), { a: 1 },
                'should be object with one value');
  });

  test('VContext.create sets vCon[paramName] to arg value', function () {
    t.deepEqual(VContext.create([1, 2], ['a', 'b']).allValues(), { a: 1, b: 2 },
                'should have all values');
  });

  test('create with locals is merged with args taking precedence', function () {
    var locals = { a: 11, c: 30 };
    t.deepEqual(VContext.create([1, 2], ['a', 'b'], locals).allValues(),
                { a: 1, b: 2, c: 30 }, 'should have merge of values');
  });

  test('create with locals should not modify original locals', function () {
    var locals = { a: 11, c: 30 };
    t.deepEqual(VContext.create([1, 2], ['a', 'b'], locals).allValues(),
                { a: 1, b: 2, c: 30 }, 'should have merge of values');
    t.deepEqual(locals, { a: 11, c: 30 }, 'should not modify original locals object');
  });

  test('getVar on null returns null', function () {
    t.equal(VContext.create([null], ['a']).getVar('a'), null);
    t.equal(VContext.create([{ b: null }], ['a']).getVar('a.b'), null);
  });

  test('getVar on undefined or null parent returns undefined', function () {
    t.equal(VContext.create([], []).getVar('a'), undefined);
    t.equal(VContext.create([], ['a']).getVar('a'), undefined);
    t.equal(VContext.create([], ['a']).getVar('a.b'), undefined);
    t.equal(VContext.create([], ['a']).getVar('a.b.c'), undefined);
    t.equal(VContext.create([null], ['a']).getVar('a.b'), undefined);
    t.equal(VContext.create([null], ['a']).getVar('a.b.c'), undefined);
    t.equal(VContext.create([1], ['a']).getVar('a.b'), undefined);
    t.equal(VContext.create([1], ['a']).getVar('a.b.c'), undefined);
  });

  test('simple getVar returns existing value', function () {
    t.equal(VContext.create([null], ['a']).getVar('a'), null);
    t.equal(VContext.create([1], ['a']).getVar('a'), 1);
    t.equal(VContext.create([true], ['a']).getVar('a'), true);
    t.equal(VContext.create(['banana'], ['a']).getVar('a'), 'banana');
  });

  test('getVar on literals returns the literal', function () {
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
  });

  test('getVar for property returns the property', function () {
    var o = { b: 100};
    t.equal(VContext.create([o], ['a']).getVar('a.b'), 100);
    o = { b: { c: 200 }};
    t.equal(VContext.create([o], ['a']).getVar('a.b.c'), 200);
  });

  test('setVar will create objects if needed', function () {
    var v = VContext.create([], []);
    v.setVar('foo.bar.baz', 100);
    t.deepEqual(v.allValues(), { foo: { bar: { baz: 100}}});
  });

  test('simple setVar', function () {
    var v = VContext.create([], []);
    v.setVar('foo', 100);
    t.deepEqual(v.allValues(), { foo: 100});
  });

  test('setVar will not affect other vars', function () {
    var v = VContext.create([{ bar: 1}], ['foo']);
    v.setVar('foo.baz', 2);
    t.deepEqual(v.allValues(), { foo: { bar: 1, baz: 2 }});
  });

  test('setVar with null key, will not set anything', function () {
    var v = VContext.create([{ bar: 1}], ['foo']);
    v.setVar(null, 2);
    t.deepEqual(v.allValues(), { foo: { bar: 1 }});
  });

  test('setVar with undefined key, will not set anything', function () {
    var v = VContext.create([{ bar: 1}], ['foo']);
    v.setVar(undefined, 2);
    t.deepEqual(v.allValues(), { foo: { bar: 1 }});
  });

  test('saveResults will set values for params and :LAST_RESULTS', function () {
    var v = VContext.create([], []);
    v.saveResults(['foo', 'bar', 'cat'], [1, 'hello', null]);
    t.deepEqual(v.allValues(), { foo: 1, bar: 'hello', cat: null,
                            ':LAST_RESULTS': [1, 'hello', null] });
  });

  test('saveResults set :LAST_RESULT w/all even params is short', function () {
    var v = VContext.create([], []);
    v.saveResults(['foo'], [1, 'hello', null]);
    t.deepEqual(v.allValues(), { foo: 1,
                            ':LAST_RESULTS': [1, 'hello', null] });
  });

  test('saveResults will set values for params and :LAST_RESULTS', function () {
    var v = VContext.create([], []);
    v.saveResults(['foo', 'bar', 'cat'], [1, 'hello', null]);
    t.deepEqual(v.allValues(), { foo: 1, bar: 'hello', cat: null,
                            ':LAST_RESULTS': [1, 'hello', null] });
  });

  test('saveResults upgrades undefined to null, but :LAST_RESULT is exact', function () {
    var v = VContext.create([], []);
    v.saveResults(['foo', 'bar', 'baz'], [1, undefined]);
    t.deepEqual(v.allValues(), { foo: 1, bar: null, baz: null, 
                            ':LAST_RESULTS': [1, undefined] });
  });

  test('saveResults null params skips saving, :LAST_RESULT is exact', function () {
    var v = VContext.create([], []);
    v.saveResults(['foo', null], [1, 20]); //skip second param
    t.deepEqual(v.allValues(), { foo: 1, ':LAST_RESULTS': [1, 20] });
  });

}());