# Alternate DSL's

These DSL's are not loaded by default and thus require a separate require if you want to use one.

Since React is an AST based rules system, it allows custom DSL's to be created easily, they only need to generate the AST and they are fully functional, allowing many different interfaces for the same system.


### Examples using the AST directly or alternate DSL's


 1. [Using pseudocode DSL](#pcode)
 2. [Using jquery-like chaining DSL](#chain)
 3. [Function String DSL](#fstr)  (Deprecated)


<a name="pcode"/>
### Example using pseudocode DSL interface

```javascript
var pcodeDefine = require('react/dsl/pcode');

function multiply(a, b, cb) { cb(null, a * b); }
function add(a, b) { return a + b; }
var locals = {   // since pcodeDefine uses strings, need references to functions passed into react
  multiply: multiply,
  add: add
};

var fn = pcodeDefine('a, b, cb', [  // input params
  'm := multiply(a, b)',   // using a callback function, use :=
  's = add(m, a)',        // using a sync function, use =
  'cb(err, m, s)'     // output params for final callback
], locals);    // hash of functions that will be used

fn(2, 3, function (err, m, s) {
  console.error('err:', err); // null
  console.error('m:', m);  // 2 * 3 = 6
  console.error('s:', s);  // 6 + 2 = 8
});
```

<a name="chain"/>
### Example using jquery-like chaining DSL interface

```javascript
var chainDefine = require('react/dsl/chain');

function multiply(a, b, cb) { cb(null, a * b); }
function add(a, b) { return a + b; }

var fn = chainDefine()
  .in('a', 'b', 'cb')                                   // input params
  .out('err', 'm', 's')                                 // final callback output params
  .async(multiply).in('a', 'b', 'cb').out('err', 'm')   // task def - async fn, in params, callback out params
  .sync(add).in('m', 'a').out('s')                      // task def - sync fn, in params, return value
  .end();

fn(2, 3, function (err, m, s) {
  console.error('err:', err); // null
  console.error('m:', m);  // 2 * 3 = 6
  console.error('s:', s);  // 6 + 2 = 8
});
```

<a name="fstr"/>
### Example using Function String DSL interface

The Function String DSL interface is deprecated since it morphed into the default DSL which is very similar. It is recommended that you use the default DSL instead.

```javascript
var fstrDefine = require('react/dsl/fstr');

function loadUser(uid, cb){ setTimeout(cb, 100, null, "User"+uid); }
function loadFile(filename, cb){ setTimeout(cb, 100, null, 'Filedata'+filename); }
function markdown(filedata) { return 'html'+filedata; }
function prepareDirectory(outDirname, cb){ setTimeout(cb, 200, null, 'dircreated-'+outDirname); }
function writeOutput(html, user, cb){  setTimeout(cb, 300, null, html+'_bytesWritten'); }
function loadEmailTemplate(cb) { setTimeout(cb, 50, null, 'emailmd'); }
function customizeEmail(user, emailHtml, cb) { return 'cust-'+user+emailHtml; }
function deliverEmail(custEmailHtml, cb) { setTimeout(cb, 100, null, 'delivered-'+custEmailHtml); }

function useHtml(err, html, user, bytesWritten) {
  if(err) {
    console.log('***Error: %s', err);
    return;
  }
  console.log('final result: %s, user: %s, written:%s', html, user, bytesWritten);
}

var loadAndSave = fstrDefine('filename, uid, outDirname, cb', [  // input params
  loadUser,         'uid              -> err, user',     // calling async fn loadUser with uid, callback is called with err and user
  loadFile,         'filename         -> err, filedata',
  markdown,         'filedata         -> returns html',    // using a sync function
  prepareDirectory, 'outDirname       -> err, dircreated',
  writeOutput,      'html, user       -> err, bytesWritten', { after: prepareDirectory },  // only after prepareDirectory done
  loadEmailTemplate, '                 -> err, emailmd',
  markdown,         'emailmd          -> returns emailHtml',   // using a sync function
  customizeEmail,   'user, emailHtml  -> returns custEmailHtml',
  deliverEmail,     'custEmailHtml    -> err, deliveredEmail', { after: writeOutput }  // only after writeOutput is done
], 'err, html, user, bytesWritten');   // callback output params

loadAndSave('file.md', 100, '/tmp/foo', useHtml);  // executing the flow
```
