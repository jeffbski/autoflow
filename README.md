# React.js

[![Build Status](https://secure.travis-ci.org/jeffbski/react.png?branch=master)](http://travis-ci.org/jeffbski/react)

React is a javascript module to make it easier to work with asynchronous code, by reducing boilerplate code and improving error and exception handling while allowing variable and task dependencies when defining flow. This project is applying the concepts of Reactive programming or Dataflow to controlling application flow.

This async flow control module is initially designed to work with Node.js but is planned to be extended to browser and other environments.

React gets its name from similarities with how "chain reactions" work in the physical world. You start the reaction and then it cascades and continues until complete.

Also "Reactive Programming" or "Dataflow" describe defining flow which reacts to the data similar to how a spreadsheet updates cells. These are good examples of how React controls flow based on when data is available

 - Reactive programming - <http://en.wikipedia.org/wiki/Reactive_programming>
 - Dataflow programming - <http://en.wikipedia.org/wiki/Dataflow>
 - Dataflow Programming: Handling Huge Data Loads Without Adding Complexity (Dr. Dobb's Sept 19, 2011) - <http://drdobbs.com/database/231400148>

It takes inspiration from several projects including:

 - Tim Caswell and Elijah Insua's [conductor](https://github.com/tmpvar/conductor) - [Article](http://howtonode.org/step-of-conductor)
 - Caolan McMahon's [async](https://github.com/caolan/async)

## Example Video and Comparison

Ryan Atkinson did a nice job of demonstrating some of the power of react as compared to async and native callback code. http://www.youtube.com/embed/5EDucc56UnA?rel=0

You can read more and see his example site here https://github.com/ryanatkn/react-writeup


## Goals

 - Minimize boilerplate code needed for working with asynchronous functions
 - Minimize the need to customize your code simply to use async flow control. The use of a flow control module ideally should not affect the way you write your code, it should only help take over some of the burden.
 - Improved error and exception handling
 - Provide useful stack traces and context information for easier debugging
 - Make code more readable and easier to understand which should translate to less defects
 - Provide the right level of abstraction to make it easier to refactor code, without being too magical
 - Allow the mixing of pure functions, method calls, and callback style functions in the flow

## Supports

 - async node-style callback(err, arg...) functions
 - sync functions which directly return value
 - object instance method calls
 - class method calls
 - selectFirst flow where the first task that returns defined, non-null value is used
 - promise style functions - also automatic resolution of promise inputs (optionally loaded with `react.resolvePromises();`)
 - use of resulting flow function as callback style or promise style (if no callback provided) (provided via plugin corresponding to the promise library used) See https://github.com/jeffbski/react-deferred
 - supports ES5 browsers (can work with others by using polyfills)
 - (planned) iteration on arrays, streams, sockets
 - (planned) event emitter integration
 - tested on node 0.8, 0.10, 0.11

The tasks can be mixed, meaning you can use async, sync, object method calls, class method calls, etc in the same flow.

## Concept

Borrowing heavily from Tim and Elijah's ideas for conductor, this async flow control module provides a way to construct a flow from a
collection of rules based on functions or methods (referred to as _tasks_ in this module). It allows dependencies to be defined between the tasks so they can run in parallel as their dependencies are satisfied. React can us both variable dependencies and task dependencies.

As tasks complete, React watches the dependencies and kicks off additional tasks that have all their dependencies met and are ready to execute. This allows the flow to run at maximum speed without needing to arbitrarily block tasks into groups of parallel and serial flow.

To reduce the boilerplate code needed and improve error handling, React automatically provides callback functions for your asynchronous code. These React-provided callback functions perform these steps:

 1. check for error and handle by calling outer callback function with this error after augmenting it with additional context information for easier debugging
 2. save the callback variables into a context for future reference
 3. call back into React (and it will kick off additional tasks that  are now ready to go)
 4. Using the dependencies specified for each

## Design

 - Parse and validate DSL rules at module load time creating AST
 - Validate the flow AST at module load time - determine if dependencies can all be met as defined
 - Execute the flow AST by calling the function with arguments

## Installing

    npm install react

OR

Pull from github - http://github.com/jeffbski/react

## Examples

<a name="defaultDSL"/>
### Example using default DSL interface

 - Simple example showing flow definition of two async functions feeding a
   synchronous function.

 - First two async functions inputs are satisfied by the flow inputs, so
   they will both run immediately in parallel.

 - The last function waits for the outputs of the previous ones, then
   executes synchronously.

 - Finally the flow calls the callback with the output values once all
   the tasks have completed.

```javascript
// in your foobar module
var react = require('react');

// some normal async and sync functions
function loadFoo(fooPath, cb) {
  setTimeout(function () {
    cb(null, [fooPath, 'data'].join(':'));
  }, 10);
}

function loadBar(barPath, barP2, cb) {
  setTimeout(function () {
    cb(null, [barPath, barP2, 'data'].join(':'));
  }, 10);
}

function render(foo, bar) {
  return ['<html>', foo, '/', bar, '</html>'].join('');
}

// define fn, glue together with react, it will parallelize
// starts with name and in/out params, then the tasks
var loadRender = react('loadRender', 'fooPath, barPath, barP2, cb -> err, renderedOut',
  loadFoo, 'fooPath, cb -> err, foo',    // async cb function
  loadBar, 'barPath, barP2, cb -> err, bar',  // async cb function
  render, 'foo, bar -> renderedOut'  // sync function using outputs from first two
);

exports.loadRender = loadRender;  // is a normal fn created by react


// in a different module far far away, use this as any other node function
var foobar = require('foobar');
foobar.loadRender('foo.txt', 'bar.txt', 'BBB', function (err, renderedOut) {
  // tasks in loadRender were parallelized based on their input dependencies
  console.error('results:', renderedOut);
});
```

Below is a graph of how the dependencies are mapped by React which
also indicates how the tasks will be executed. This was generated by the
react plugin [react-graphviz](https://github.com/jeffbski/react-graphviz)
which you can use to also graph your flows.

![simple.png](https://github.com/jeffbski/react/raw/master/doc/simple.png)



## User API

The main function returned from require('react') can be used to define the AST used for the processing of the rules or flow.

It takes the following arguments to define a flow function:

```javascript
var fn = react('loadRender', 'fooPath, barPath, barP2, cb -> err, renderedOut',
  loadFoo, 'fooPath, cb -> err, foo',
  loadBar, 'barPath, barP2, cb -> err, bar',
  render, 'foo, bar -> renderedOut'
);
```

![color-def](https://github.com/jeffbski/react/raw/master/doc/color-def.png)

 1. **flow/function name** - string - represents the name of the flow or function that will be created. React will use the name when generating events so you can monitor progress and performance and also when errors occur.
 2. **in/out flow parameter definition** - string - the inputs and outputs for the flow function. The parameters are specified in one single string for easy typing, separated by commas. The output follows the input after being separated by a `->`. Use the parameter name `cb` or `callback` to specify the Node style callback and `err` to represent the error parameter as the first output parameter of the callback. Literal values can also be specified directly (true, false, numbers, this, null). Literal strings can simply be quoted using single or double quotes.
 3. **optional flow options** - object - If an object is provided immediately after the in/out flow def, then these options will be provided to react to customize the flow. The `locals` property can contain an object map of any local variables you want to reference in the flow (other than what is passed in as parameters). For example: `{ locals: { foo: foo, bar: bar }}` would make local vars available in the flow. Note that global variables are already available in the flow.
 4. **function reference or method string** - Specify the function to be called for this task, or if calling a method off of an object being passed in or returned by a task, use a string to specify like `'obj.method'`. These can be asynchronous Node-style callback `cb(err, ...)` functions or synchronous functions which simply return values directly.
 5. **in/out task parameter definition** - string - similar to the in/out flow parameter definition above, these are the inputs and outputs that are passed to a task function and returned from a task function. The inputs will need to match either those from the flow inputs or outputs from other tasks that will run before this task. React will use the inputs as dependencies, so it will invoke and wait for response from the tasks that provide the dependent inputs. So simply by specifying inputs and outputs for the tasks, React will prioritize and parallelize tasks to run as fast as possible. Use `cb` or `callback` along with `err` to specify asynchronous Node style `cb(err, ...)` task, or omit both to specify a synchronous task.A synchronous task can only have a single return parameter.
 6. **optional task options** - object - if an object is provided this can be used to specify additional options for this task.  Currently the valid options for a task are:
   - **name** - string - specifies a name for a task, otherwise React will try to use the function name or method string if it is unique in the flow. If a name is not unique subsequent tasks will have `_index` (zero based index of the task) added to create unique name. If you specify a name, you will also want to indicate a unique name for within the flow otherwise it will get a suffix as well. Example: `{ name: 'myTaskName' }`
   - **after** - string, function reference, or array of string or function refs - specify additional preconditions that need to be complete before this task can run. In addition to the input dependencies being met, wait for these named tasks to complete before running.  The preconditions are specified using the name of the task or if the task function was only used once and is a named function (not anonymous), you can just provide the function reference and it will determine name from it. Example: `{ after: 'foo' }` or `{ after: ['foo', 'bar'] }`
 7. **repeat 4-6** - repeat steps 4-6 to specify additional tasks in this flow. As dependencies are met for tasks, React will invoke additional tasks that are ready to run in the order they are defined in this flow definition. So while the order does have some influence on the execution, it is primarily defined by the input dependencies and any other additonal preconditions specified with the `after` option. If you want to guarantee that something only runs after something else completes, then it will need to use an output from that task or specify the dependency with an `after`.


The flow function created by react from the input definition is a normal Node-style function which can be used like any other. These flow functions can be defined in a module and exported, they can be passed into other functions, used as methods on objects (the `this` context is passed in and available).

### Debugging React

React has a built-in plugin which can be loaded that will enable logging of tasks and flow as it executes very useful for debugging.  For full details see [Advanced React - LogEvents](https://github.com/jeffbski/react/blob/master/doc/advanced.md#LogEvents) along with the other plugins and an explanation of the AST React uses.

```javascript
var react = require('react');
react.logEvents(); // turn on flow and task logging for all react functions
```

### Advanced React

React has many additional plugins and features which enable logging, monitoring, promise resolution, etc.

See the [Advanced React](https://github.com/jeffbski/react/blob/master/doc/advanced.md) for details on the AST React uses for processing and other plugins that are available.



## Status

 - 2013-05-23 - Allow use of globals without needing to specify in locals, move 'use strict' into define, upgrade amdefine@0.0.5, eventemitter@0.4.11, requirejs@2.1.6, mocha@1.10.0, chai@1.6.0, jake@0.5.15 (v0.7.0)
 - 2013-04-12 - Update to test on node 0.8, 0.10, 0.11
 - 2012-10-17 - Fix issue with logEvents and provide way to disable logEvents(false) (v0.6.3)
 - 2012-09-12 - Upgrade RequireJS@2.0.6, mocha@1.4.2, chai@1.2.0, jake@0.3.16.  Update travis config to include Node 0.8 (v0.6.2)
 - 2012-04-25 - Browser compatibility issue with process check, (v0.6.1)
 - 2012-04-05 - Remove dependency on sprint, use util.format
 - 2012-03-28 - Make react AMD-enabled and compatible with ES5 browsers and node.js, provide single file dist and min, add browser tests (v0.6.0)
 - 2012-03-24 - Add Travis-CI, remove promised-io since failing to install in travis-ci for node 0.6/0.7, switch from tap to mocha/chai
 - 2012-03-12 - Pass ast.define events to process (v0.5.2)
 - 2012-01-18 - Remove old DSL interfaces, improve plugin loading, log flow name with task name, ast.defined event, test with node 0.7.0 (v0.5.1)
 - 2012-01-17 - Additional documentation (v0.3.5)
 - 2012-01-16 - Refine events and create logging plugin (v0.3.3)
 - 2012-01-13 - Add promise tasks, promise resolution, refactor alternate DSL interfaces as optional requires (v0.3.0)
 - 2012-01-11 - Provide warning/error when name is skipped in default DSL, literal check in validate (v0.2.5)
 - 2012-01-10 - Create default DSL for react(), create error for missing variables, list remaining tasks when flow won't complete
 - 2011-12-21 - Refactor from ground up with tests, changes to the interfaces
 - 2011-10-26 - React is in active development and interface may change frequently in these early stages. Current code is functional but does not perform validation yet.  Additional interfaces are planned to make it easy to define flows in a variety of ways. Documentation and examples forthcoming.

## Test Results

[![Build Status](https://secure.travis-ci.org/jeffbski/react.png?branch=master)](http://travis-ci.org/jeffbski/react)

```bash
mocha

178 tests complete
```

## License

 - [MIT license](http://github.com/jeffbski/react/raw/master/LICENSE)

## Contributors

 - Author: Jeff Barczewski (@jeffbski)

## Contributing

 - Source code repository: http://github.com/jeffbski/react
 - Ideas and pull requests are encouraged  - http://github.com/jeffbski/react/issues

- You may contact me at @jeffbski or through github at http://github.com/jeffbski
