# React.js

React is a javascript module to make it easier to work with asynchronous code, 
by reducing boilerplate code and improving error and exception handling while
allowing variable and task dependencies when defining flow.

This async flow control module is initially designed to work with Node.js but 
is planned to be extended to browser and other environments.

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

## Concept

Borrowing heavily from Tim and Elijah's ideas for conductor, this async flow control module provides a way to construct a flow from a collection of functions or methods (referred to as _tasks_ in this module). It allows dependencies to be defined between the tasks so they can run in parallel as their dependencies are satisfied. React can us both variable dependencies and task dependencies. 

As tasks complete, React watches the dependencies and kicks off additional tasks that have all their dependencies met and are ready to execute. This allows the flow to run at maximum speed without needing to arbitrarily block tasks into groups of parallel and serial flow.

To reduce the boilerplate code needed and improve error handling, React automatically provides callback functions for your asynchronous code. These React-provided callback functions perform these steps:

 1. check for error and handle by calling outer callback function with this error after augmenting it with additional context information for easier debugging
 2. save the callback variables into a context for future reference
 3. call back into React (and it will kick off additional tasks that are now ready to go)

## Design

 - Optional parse step to create flow AST (TODO allow pluggable parsers to allow many interfaces)
 - Validate the flow AST - determine if dependencies can all be met as defined such that flow will complete (TODO)
 - Execute the flow AST

## Examples

 1. [Direct AST](#directAST)
 2. [Using Simple DSL](#simpleDSL)

<a name="directAST"/>
### Example directly using AST

    var react = require('react').react;

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

    var r = react();
    r.ast.inputNames = ['filename', 'uid', 'outDirname', 'cb'];
    r.ast.taskDefs = [
      { f:loadUser,          a:['uid'],               cb:['user'] },
      { f:loadFile,          a:['filename'],          cb:['filedata'] },
      { f:markdown,          a:['filedata'],          ret:['html'] },
      { f:prepareDirectory,  a:['outDirname'],        cb:['dircreated'] },
      { f:writeOutput,       a:['html', 'user'],      cb:['bytesWritten'],   after:['prepareDirectory'] },
      { f:loadEmailTemplate, a:[],                    cb:['emailmd'] },
      { f:markdown,          a:['emailmd'],           ret:['emailHtml'] },
      { f:customizeEmail,    a:['user', 'emailHtml'], ret:['custEmailHtml'] },
      { f:deliverEmail,      a:['custEmailHtml'],     cb:['deliveredEmail'], after:['writeOutput'] }
    ];
    r.ast.finalOutputNames = ['html', 'user', 'bytesWritten'];

    r.exec("hello.txt", 100, 'outHello', useHtml);
    r.exec("small.txt", 200, 'outSmall', useHtml);

<a name="simpleDSL"/>
### Example using simple DSL interface

    var react = require('react').react;

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

    var r = react('filename, uid, outDirname, cb').define(
        loadUser,         'uid              -> err, user',
        loadFile,         'filename         -> err, filedata',
        markdown,         'filedata         -> returns html',
        prepareDirectory, 'outDirname       -> err, dircreated', 
        writeOutput,      'html, user       -> err, bytesWritten', { after:prepareDirectory },
        loadEmailTemplate,'                 -> err, emailmd',
        markdown,         'emailmd          -> returns emailHtml',
        customizeEmail,   'user, emailHtml  -> returns custEmailHtml',
        deliverEmail,     'custEmailHtml    -> err, deliveredEmail', { after: writeOutput }
    ).callbackDef('err, html, user, bytesWritten');

## Status

 - 2011-10-26 - React is in active development and interface may change frequently in these early stages. Current code is functional but does not perform validation yet.  Additional interfaces are planned to make it easy to define flows in a variety of ways. Documentation and examples forthcoming.

## License

 - [MIT license](http://github.com/jeffbski/react/raw/master/LICENSE)

## Contributors

 - Author: Jeff Barczewski (@jeffbski)

## Contributing

 - Source code repository: http://github.com/jeffbski/react
 - Ideas and pull requests are encouraged  - http://github.com/jeffbski/react/issues
 - You may contact me at @jeffbski or through github at http://github.com/jeffbski