'use strict';

var error = require('./error.js');
var validate = require('./validate.js');

var reactOptions = {
  stackTraceLimitMin: 30  
};


/**
   Creates react function which the AST can be manipulated and then
   is ready to be executed. Can be used directly or a DSL can wrap this
   to provide the AST.

   @example
   var react = require('react');
   react.stackTraceLimitMin = 20;
   var fn = react();
   var valid2 = fn.setAndValidateAST({
     inParams: ['a', 'b'],
     tasks: [
      { f: multiply, a: ['a', 'b'], cb: ['c'] }
     ],
    outTask: { a: ['c'] }
   });
   console.log(fn.ast); // view
   fn(123, 456, cb);
 */
function reactFactory() {
  var ast = {
    inParams: [],
    tasks: [],
    outTask: {}
  };

  error.ensureStackTraceLimitSet(reactOptions.stackTraceLimitMin); 

  function exec(arg1, arg2, argN, cb) {
    var args = Array.prototype.slice.call(arguments);
    // use ast
    //contExec();
  }

  function setAndValidateAST(newAST) { //set AST then validate
    ast.inParams = newAST.inParams;
    ast.tasks = newAST.tasks;
    ast.outTask = newAST.outTask;
    return validate(ast);
  }
  
  var reactFn = exec;        // make the exec() the function returned
  reactFn.ast  = ast;        // put AST hanging off the fn so it can be inspected
  reactFn.setAndValidateAST = setAndValidateAST;   // call to set AST and then validate
  return reactFn;
}


module.exports = reactFactory;           // call this function to create a react function
module.exports.options = reactOptions;   // global react options

