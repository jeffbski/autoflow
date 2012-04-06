'use strict';
/*global define:true */

if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([], function () {

  /**
     Create subflows if any on the provided AST and return any errors

     @param ast - ast which will be updated with subflow fns
     @return errors array
    */
  function create(ast, reactFactory) { // create subflows if any, return array of errors
    return Object.keys(ast.sub).reduce(function (errors, subName) {
      var subFn = reactFactory();
      subFn.parent = ast.name; // set parent's name on the child
      var subAST = ast.sub[subName];
      var subErrors = subFn.setAndValidateAST(subAST);
      ast.sub[subName] = subFn;
      return errors.concat(subErrors);
    }, []);
  }

  /**
     Load the subflows into VContext

     @param env - flow environment
     @return subflowNames - vCon strings referring to the subflows loaded
    */
  function loadIntoVCon(env) {
    var ast = env.ast;
    if (!ast.sub) return;
    var subflowNames = Object.keys(ast.sub).reduce(function (accum, flowName) {
      var subflowName = 'sub:' + flowName;
      var subFn = ast.sub[flowName];
      // subFn.parentEnv = env; // set the parent's env on this child fn      
      env.vCon.setVar(subflowName, subFn);
      accum.push(subflowName);
      return accum;
    }, []);
    return subflowNames;
  }

  /**
     Load mock fn subflows into VContext for validation purposes
     @param ast - ast with possible subflows
     @param vCon - VContext which will be updated with subflows
     @return subflowNames - vCon strings referring to the subflows loaded
    */     
  function loadMockFnsIntoVCon(ast, vCon) {
    if (!ast.sub) return;
    var subflowNames = Object.keys(ast.sub).reduce(function (accum, flowName) {
      var subflowName = 'sub:' + flowName;
      vCon.setVar(subflowName, function () { }); // mock functions
      accum.push(subflowName);
      return accum;
    }, []);
    return subflowNames;
  }

  return {
    create: create,
    loadIntoVCon: loadIntoVCon,
    loadMockFnsIntoVCon: loadMockFnsIntoVCon
  };
  
});