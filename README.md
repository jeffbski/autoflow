# React.js

React is a javascript module to make it easier to work with asynchronous code,
by reducing boilerplate code and improving error and exception handling while
allowing variable and task dependencies when defining flow. This project is
applying the concepts of Reactive programming or Dataflow to controlling
application flow.

This async flow control module is initially designed to work with Node.js but
is planned to be extended to browser and other environments.

React gets its name from similarities with how "chain reactions" work in the physical world. You start the reaction and then it cascades and continues until complete.

Also "Reactive Programming" or "Dataflow" describe defining flow which reacts to the data similar to how a spreadsheet updates cells. These are good examples of how React controls flow based on when data is available

 - Reactive programming - <http://en.wikipedia.org/wiki/Reactive_programming>
 - Dataflow programming - <http://en.wikipedia.org/wiki/Dataflow>
 - Dataflow Programming: Handling Huge Data Loads Without Adding Complexity (Dr. Dobb's Sept 19, 2011) - <http://drdobbs.com/database/231400148>

It takes inspiration from several projects including:

 - Tim Caswell and Elijah Insua's [conductor](https://github.com/creationix/conductor) - [Article](http://howtonode.org/step-of-conductor)
 - Caolan McMahon's [async](https://github.com/caolan/async)


## Goals

 - Improved error and exception handling
 - Provide useful stack traces and context information for easier debugging
 - Minimize boilerplate code needed for working with asynchronous functions
 - Make code more readable and easier to understand which should translate to less defects
 - Provide the right level of abstraction to make it easier to refactor code, without being too magical
 - Allow the mixing of pure functions, method calls, and callback style functions in the flow
 - Minimize the need to customize your code simply to use async flow control. The use of a flow control module ideally should not affect the way you write your code, it should only help take over some of the burden.

## Supports

 - async node-style callback(err, arg...) functions
 - sync functions which directly return value
 - object instance method calls
 - class method calls
 - selectFirst flow where the first task that returns defined, non-null value is used
 - (planned) promise style functions - also automatic resolution of promise inputs
 - (planned) use of resulting flow function as callback style or promise style (if no callback provided)
 - (planned) iteration on arrays, streams, sockets
 - (planned) event emitter integration

The tasks can be mixed, meaning you can use async, sync, object method calls, class method calls, etc in the same flow.

## Concept

Borrowing heavily from Tim and Elijah's ideas for conductor, this async flow control module provides a way to construct a flow from a collection of functions or methods (referred to as _tasks_ in this module). It allows dependencies to be defined between the tasks so they can run in parallel as their dependencies are satisfied. React can us both variable dependencies and task dependencies.

As tasks complete, React watches the dependencies and kicks off additional tasks that have all their dependencies met and are ready to execute. This allows the flow to run at maximum speed without needing to arbitrarily block tasks into groups of parallel and serial flow.

To reduce the boilerplate code needed and improve error handling, React automatically provides callback functions for your asynchronous code. These React-provided callback functions perform these steps:

 1. check for error and handle by calling outer callback function with this error after augmenting it with additional context information for easier debugging
 2. save the callback variables into a context for future reference
 3. call back into React (and it will kick off additional tasks that are now ready to go)

## Design

 - Parse and validate ad module load time
 - Validate the flow AST at module load time - determine if dependencies can all be met as defined
 - Execute the flow AST by calling the function with params

## Installing

    npm install react

OR

Pull from github - http://github.com/jeffbski/react

## Examples

 1. [Direct AST](#directAST)
 2. [Using Function Str DSL](#fstr)
 3. [Using pseudocode DSL](#pcode)
 4. [Using jquery-like chaining DSL](#chain)


These live in the examples folder so they are ready to run.
Also see test/module-use.test.js for more examples as well
as the specific tests for the DSL you want to use.

<a name="directAST"/>
### Example directly using AST

```javascript
var react = require('react');

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
```

<a name="fstr"/>
### Example using Function String DSL interface

```javascript
var react = require('react');

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

var loadAndSave = react.fstrDefine('filename, uid, outDirname, cb', [  // input params
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

<a name="pcode"/>
### Example using pseudocode DSL interface

```javascript
var react = require('react');

function multiply(a, b, cb) { cb(null, a * b); }
function add(a, b) { return a + b; }
var locals = {   // since pcodeDefine uses strings, need references to functions passed into react
  multiply: multiply,
  add: add
};

var fn = react.pcodeDefine('a, b, cb', [  // input params
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
var react = require('react');

function multiply(a, b, cb) { cb(null, a * b); }
function add(a, b) { return a + b; }

var fn = react.chainDefine()
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

## Status

 - 2011-12-21 - Refactor from ground up with tests, changes to the interfaces
 - 2011-10-26 - React is in active development and interface may change frequently in these early stages. Current code is functional but does not perform validation yet.  Additional interfaces are planned to make it easy to define flows in a variety of ways. Documentation and examples forthcoming.

## Test Results

```bash
ok ast.test.js .................... 10/10
ok cb-task.test.js ................ 31/31
ok chain.test.js .................. 56/56
ok core.test.js ................... 98/98
ok event-manager.test.js .......... 13/13
ok exec-options.test.js ............. 3/3
ok finalcb-task.test.js ............. 5/5
ok fstr.test.js ................... 64/64
ok input-parser.test.js ........... 15/15
ok module-use.test.js ............. 55/55
ok pcode.test.js .................. 65/65
ok ret-task.test.js ............... 31/31
ok task.test.js ..................... 1/1
ok validate-cb-task.test.js ......... 6/6
ok validate-ret-task.test.js ........ 7/7
ok validate.test.js ............... 26/26
ok vcon.test.js ................... 42/42
total ........................... 545/545

ok
```

## License

 - [MIT license](http://github.com/jeffbski/react/raw/master/LICENSE)

## Contributors

 - Author: Jeff Barczewski (@jeffbski)

## Contributing

 - Source code repository: http://github.com/jeffbski/react
 - Ideas and pull requests are encouraged  - http://github.com/jeffbski/react/issues

- You may contact me at @jeffbski or through github at http://github.com/jeffbski
