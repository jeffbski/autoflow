'use strict';

var react = require('../'); // require('react');

function load(res, cb) { setTimeout(cb, 100, null, res + '-loaded'); }
function prefix(prefstr, str, cb) { setTimeout(cb, 100, null, prefstr + str); }
function postfix(str, poststr, cb) { setTimeout(cb, 100, null, str + poststr); }
function upper(str) { return str.toUpperCase(); }

var fn = react();
var errors = fn.setAndValidateAST({
  inParams: ['res', 'prefstr', 'poststr'],
  tasks: [
    { f: load,    a: ['res'],              out: ['lres'] },
    { f: upper,   a: ['lres'],             out: ['ulres'], type: 'ret'  },
    { f: prefix,  a: ['prefstr', 'ulres'], out: ['plres'] },
    { f: postfix, a: ['plres', 'poststr'], out: ['plresp'] }
  ],
  outTask: { a: ['plresp'] }
});
console.error('errors:', errors); // []

fn('foo', 'pre-', '-post', function cb(err, lres) {
  console.error('err:', err);  // null
  console.error('lres:', lres); // pre-FOO-LOADED-post
});
