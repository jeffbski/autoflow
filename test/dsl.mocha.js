/*global react:true sprintf:true */

if (typeof(chai) === 'undefined') {
  var chai = require('chai');
}

if (typeof(react) === 'undefined') {
  var react = require('../'); //require('react');
}

if (typeof(sprintf) === 'undefined') {
  var sprintf = require('../lib/sprintf');
}

(function () {
  'use strict';

  var t = chai.assert;

  /**
     Testing DSL
  */

  suite('dsl');

  function falpha() { }
  function fbeta() { }

  test('module exports is a fn with properties', function (done) {
    t.isFunction(react, 'has define by DSL method'); //
    t.isFunction(react.selectFirst, 'has selectFirst define method');
    done();
  });

  test('no arguments -> empty name, inParams, tasks, outTask', function (done) {
    var r = react();
    t.equal(r.ast.name.slice(0, 'flow_'.length), 'flow_', 'generated flow name should start with flow_');
    t.deepEqual(r.ast.inParams, []);
    t.deepEqual(r.ast.tasks, []);
    t.deepEqual(r.ast.outTask, { a: [], type: 'finalcb' });
    done();
  });


  test('empty first string -> empty name, inParams, tasks, outTask', function (done) {
    var r = react('');
    t.equal(r.ast.name.slice(0, 'flow_'.length), 'flow_', 'generated flow name should start with flow_');
    t.deepEqual(r.ast.inParams, []);
    t.deepEqual(r.ast.tasks, []);
    t.deepEqual(r.ast.outTask, { a: [], type: 'finalcb' });
    done();
  });


  test('single first string -> name, inParams["foo"], empty tasks, outTask', function (done) {
    var r = react('foo');
    t.equal(r.ast.name, 'foo');
    t.deepEqual(r.ast.inParams, []);
    t.deepEqual(r.ast.tasks, []);
    t.deepEqual(r.ast.outTask, { a: [], type: 'finalcb' });
    done();
  });

  test('triple first string -> inParams["foo", "bar", "baz"], empty tasks, outTask',
    function (done) {
      var r = react('myName', ' foo,   bar,baz  ');
      t.equal(r.ast.name, 'myName');
      t.deepEqual(r.ast.inParams, ['foo', 'bar', 'baz']);
      t.deepEqual(r.ast.tasks, []);
      t.deepEqual(r.ast.outTask, { a: [], type: 'finalcb' });
      done();
    });

  test('single task, single out params', function (done) {
    var r = react('myName', 'cb -> err, c',
                  falpha, 'cb -> err, c'
                 );
    t.deepEqual(r.ast.inParams, []);
    t.deepEqual(r.ast.tasks, [
      { f: falpha, a: [], out: ['c'], type: 'cb', name: 'falpha'}
    ]);
    t.deepEqual(r.ast.outTask, { a: ['c'], type: 'finalcb' });
    done();
  });

  test('single task, err and out params', function (done) {
    var r = react('myName', 'cb -> err, c',
                  falpha, 'cb -> err, c'
                 );
    t.deepEqual(r.ast.inParams, []);
    t.deepEqual(r.ast.tasks, [
      { f: falpha, a: [], out: ['c'], type: 'cb', name: 'falpha'}
    ]);
    t.deepEqual(r.ast.outTask, { a: ['c'], type: 'finalcb' });
    done();
  });

  test('using - with literal string', function (done) {
    var r = react('myName', '"hello-world", cb -> err, c',
                  falpha, '"another-string", cb -> err, c'
                 );
    t.deepEqual(r.ast.inParams, ['"hello-world"']);
    t.deepEqual(r.ast.tasks, [
      { f: falpha, a: ['"another-string"'], out: ['c'], type: 'cb', name: 'falpha'}
    ]);
    t.deepEqual(r.ast.outTask, { a: ['c'], type: 'finalcb' });
    done();
  });

  test('single task, ERR and out params', function (done) {
    var r = react('myName', 'cb -> ERR, c',
                  falpha, 'cb -> ERR, c'
                 );
    t.deepEqual(r.ast.inParams, []);
    t.deepEqual(r.ast.tasks, [
      { f: falpha, a: [], out: ['c'], type: 'cb', name: 'falpha'}
    ]);
    t.deepEqual(r.ast.outTask, { a: ['c'], type: 'finalcb' });
    done();
  });

  test('cb used in defs is simply ignored', function (done) {
    var r = react('myName', 'a, b, cb -> err, c',
                  falpha, 'a, b, cb -> err, c'
                 );
    t.deepEqual(r.ast.inParams, ['a', 'b']);
    t.deepEqual(r.ast.tasks, [
      { f: falpha, a: ['a', 'b'], out: ['c'], type: 'cb', name: 'falpha'}
    ]);
    t.deepEqual(r.ast.outTask, { a: ['c'], type: 'finalcb' });
    done();
  });

  test('callback used in defs is simply ignored', function (done) {
    var r = react('myName', 'a, b, callback -> err, c',
                  falpha, 'a, b, callback -> err, c'
                 );
    t.deepEqual(r.ast.inParams, ['a', 'b']);
    t.deepEqual(r.ast.tasks, [
      { f: falpha, a: ['a', 'b'], out: ['c'], type: 'cb', name: 'falpha'}
    ]);
    t.deepEqual(r.ast.outTask, { a: ['c'], type: 'finalcb' });
    done();
  });

  test('two inputs, two tasks, two out params', function (done) {
    var r = react('myName', 'a, b, cb -> err, c, d',
                  falpha, 'a, b, cb -> err, c',
                  fbeta,  'a, b, cb -> err, d, e'
                 );
    t.deepEqual(r.ast.inParams, ['a', 'b']);
    t.deepEqual(r.ast.tasks, [
      { f: falpha, a: ['a', 'b'], out: ['c'], type: 'cb', name: 'falpha'},
      { f: fbeta,  a: ['a', 'b'], out: ['d', 'e'], type: 'cb', name: 'fbeta'}
    ]);
    t.deepEqual(r.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
    done();
  });

  test('two inputs, two tasks, two out params, options', function (done) {
    var r = react('myName', 'a, b, cb -> err, c, d',
                  { otherOptFoo: 'foo'},  // main flow options
                  falpha, 'a, b, cb -> err, c',
                  fbeta,  'a, b, cb -> err, d, e'
                 );
    t.deepEqual(r.ast.inParams, ['a', 'b']);
    t.deepEqual(r.ast.tasks, [
      { f: falpha, a: ['a', 'b'], out: ['c'], type: 'cb', name: 'falpha'},
      { f: fbeta,  a: ['a', 'b'], out: ['d', 'e'], type: 'cb', name: 'fbeta'}
    ]);
    t.deepEqual(r.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
    t.equal(r.ast.name, 'myName', 'name should match');
    t.equal(r.ast.otherOptFoo, 'foo', 'other options should pass through');
    done();
  });

  test('two inputs, two mixed tasks, two out params', function (done) {
    var r = react('myName', 'a, b, cb -> err, c, d',
                  falpha, 'a, b, cb -> err, c',
                  fbeta,  'a, b -> d'
                 );
    t.deepEqual(r.ast.inParams, ['a', 'b']);
    t.deepEqual(r.ast.tasks, [
      { f: falpha, a: ['a', 'b'], out: ['c'], type: 'cb', name: 'falpha'},
      { f: fbeta,  a: ['a', 'b'], out: ['d'], type: 'ret', name: 'fbeta'}
    ]);
    t.deepEqual(r.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
    done();
  });


  test('two inputs, two mixed tasks, two out params, opts', function (done) {
    var r = react('myName', 'a, b, cb -> err, c, d',
                  falpha, 'a, cb -> err, c', { after: fbeta },
                  fbeta,  'a, b -> d'
                 );
    t.deepEqual(r.ast.inParams, ['a', 'b']);
    t.deepEqual(r.ast.tasks, [
      { after: ['fbeta'], f: falpha, a: ['a'], out: ['c'], type: 'cb', name: 'falpha'},
      { f: fbeta,  a: ['a', 'b'], out: ['d'], type: 'ret', name: 'fbeta'}
    ]);
    t.deepEqual(r.ast.outTask, { a: ['c', 'd'], type: 'finalcb' });
    done();
  });


    // Object use
  test('object prop task params', function (done) {
    var r = react('myName', 'a, b, cb -> err, c, e',
                  falpha, 'a, b.cat, cb -> err, c',
                  fbeta,  'c.dog, b -> d',
                  'd.egg', 'c, cb -> err, e'
                 );
    t.deepEqual(r.ast.inParams, ['a', 'b']);
    t.deepEqual(r.ast.tasks, [
      { f: falpha, a: ['a', 'b.cat'], out: ['c'], type: 'cb', name: 'falpha'},
      { f: fbeta,  a: ['c.dog', 'b'], out: ['d'], type: 'ret', name: 'fbeta'},
      { f: 'd.egg', a: ['c'], out: ['e'], type: 'cb', name: 'd.egg'}
    ]);
    t.deepEqual(r.ast.outTask, { a: ['c', 'e'], type: 'finalcb' });
    done();
  });

  // Errors

  test('missing name, throws error', function (done) {
    var fn = function () {
      var r = react('cb -> err, c',
                    falpha, 'cb -> err, c'
                   );
    };
    t.throws(fn, 'first flow parameter should be the flow name, but found in/out def: cb -> err, c');
    done();
  });

  test('missing err in flow in/out - force for consistency, throw error', function (done) {
    var fn = function () {
      var r = react('myname', 'cb -> c',  // missing err
                    falpha, 'cb -> err, c'
                   );
    };
    t.throws(fn, 'callback specified, but first out param was not "err", use for clarity. Found in/out def: cb -> c');
    done();
  });

  test('missing err in task in/out - force for consistency, throw error', function (done) {
    var fn = function () {
      var r = react('myname', 'cb -> err, c',
                    falpha, 'cb -> c'  // missing err
                   );
    };
    t.throws(fn, 'callback specified, but first out param was not "err", use for clarity. Found in/out def: cb -> c');
    done();
  });

  test('found err, but missing cb/callback in flow in/out - force for consistency, throw error', function (done) {
    var fn = function () {
      var r = react('myname', 'a -> err, c', // missing cb
                    falpha, 'cb -> err, c'
                   );
    };
    t.throws(fn, 'found err param, but cb/callback is not specified, is this cb-style async or sync function? Found in/out def: a -> err, c');
    done();
  });

  test('found err, but missing cb/callback in task in/out - force for consistency, throw error', function (done) {
    var fn = function () {
      var r = react('myname', 'cb -> err, c',
                    falpha, 'a -> err, c'  // missing cb
                   );
    };
    t.throws(fn, 'found err param, but cb/callback is not specified, is this cb-style async or sync function? Found in/out def: a -> err, c');
    done();
  });

  test('extra arg throws error', function (done) {
    var fn = function () {
      var r = react('myName', 'a, b, cb -> err, c, d',
                    falpha, 'a, cb -> err, c', { after: fbeta },
                    fbeta,  'a, b -> returns d',
                    'extraBadArg'
                   );
    };
    t.throws(fn, 'extra unmatched task arg: extraBadArg');
    done();
  });

  test('not enough args throws error', function (done) {
    var fn = function () {
      var r = react('myName', 'a, b, cb -> err, c, d',
                    falpha, 'a, cb -> err, c', { after: fbeta },
                    fbeta
                   );
    };
    t.throws(fn, sprintf('extra unmatched task arg: %s', fbeta));
    done();
  });

  test('long example', function (done) {
    /*jshint white: false */

    function loadUser(uid, cb){ setTimeout(cb, 100, null, "User"+uid); }
    function loadFile(filename, cb){ setTimeout(cb, 100, null, 'Filedata'+filename); }
    function markdown(filedata) { return 'html'+filedata; }
    function prepareDirectory(outDirname, cb){ setTimeout(cb, 200, null, 'dircreated-'+outDirname); }
    function writeOutput(html, user, cb){  setTimeout(cb, 300, null, html+'_bytesWritten'); }
    function loadEmailTemplate(cb) { setTimeout(cb, 50, null, 'emailmd'); }
    function customizeEmail(user, emailHtml) { return 'cust-'+user+emailHtml; }
    function deliverEmail(custEmailHtml, cb) { setTimeout(cb, 100, null, 'delivered-'+custEmailHtml); }
    var loadAndSave = react(
      'loadAndSave',     'filename, uid, outDirname, cb -> err, html, user, bytesWritten',  // name, in/out params
      loadUser,          'uid, cb           -> err, user',     // calling async fn loadUser with uid, cb is called w/ err & user
      loadFile,          'filename, cb      -> err, filedata',
      markdown,          'filedata          -> html',    // using a sync function
      prepareDirectory,  'outDirname, cb    -> err, dircreated',
      writeOutput,       'html, user, cb    -> err, bytesWritten', { after: prepareDirectory },  // after prepareDirectory done
      loadEmailTemplate, 'cb                -> err, emailmd',
      markdown,          'emailmd           -> emailHtml',   // using a sync function
      customizeEmail,    'user, emailHtml   -> custEmailHtml',
      deliverEmail,      'custEmailHtml, cb -> err, deliveredEmail', { after: writeOutput }  // only after writeOutput is done
    );

    loadAndSave('file.md', 100, '/tmp/foo', function (err, html, user, bytesWritten) {  // executing the flow
      t.equal(err, null);
      t.equal(html, 'htmlFiledatafile.md');
      t.equal(user, 'User100');
      t.equal(bytesWritten, 'htmlFiledatafile.md_bytesWritten');
      done();
    });
  });

  // selectFirst

  test('selectFirst', function (done) {
    var r = react.selectFirst('myName', 'a, b, cb -> err, c',
                              { otherOptFoo: 'foo'},  // main options
                              falpha, 'a, b, cb -> err, c',
                              fbeta,  'a, b -> c'
                             );
    t.equal(r.ast.name, 'myName');
    t.deepEqual(r.ast.inParams, ['a', 'b']);
    t.deepEqual(r.ast.tasks, [
      { f: falpha, a: ['a', 'b'], out: ['c'], type: 'cb', name: 'falpha'},
      { f: fbeta,  a: ['a', 'b'], out: ['c'], type: 'ret', name: 'fbeta', after: ['falpha']}
    ]);
    t.deepEqual(r.ast.outTask, { type: 'finalcbFirst', a: ['c'] });
    t.equal(r.ast.name, 'myName', 'name should match if supplied');
    t.equal(r.ast.otherOptFoo, 'foo', 'other options should pass through');
    done();
  });

}());