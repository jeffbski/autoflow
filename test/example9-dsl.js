'use strict';

/**
  Using object methods in addition to functions with simple DSL
  also passing in an options object and referring to the properties.
  The dependency is on the object existing, if it exists, it expects the values
  to be there.
 */

var reactMod = require(__dirname+'/../lib/react.js'); 
var react = reactMod.react;
var reactOptions = reactMod.reactOptions;
reactOptions.debugOutput = true;
reactOptions.stackTraceLimitMin = 20;

var UserMgr = function(){ };
UserMgr.prototype = {};
UserMgr.prototype.constructor = UserMgr;
UserMgr.prototype.loadUser = function loadUser(uid, cb){ setTimeout(cb, 100, null, "User"+uid); };

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
  console.log('final result: %s, user: %s, written: %s', html, user, bytesWritten);     
}

var r = react('options, uid, anObj, cb').define(
    'anObj.loadUser', 'uid                -> err, user',
    loadFile,         'options.filename   -> err, filedata',
    markdown,         'filedata           -> returns html',
    prepareDirectory, 'options.outDirname -> err, dircreated', 
    writeOutput,      'html, user         -> err, bytesWritten', { after:prepareDirectory },
    loadEmailTemplate,'                   -> err, emailmd',
    markdown,         'emailmd            -> returns emailHtml',
    customizeEmail,   'user, emailHtml    -> returns custEmailHtml',
    deliverEmail,     'custEmailHtml      -> err, deliveredEmail', { after: writeOutput }
).callbackDef('err, html, user, bytesWritten');


//console.log(r.ast);

var myObj = new UserMgr();
r.exec({ filename: "hello.txt", outDirname: 'outHello' }, 100, myObj, useHtml);
r.exec({ filename: "small.txt", outDirname: 'outSmall' }, 200, myObj, useHtml);
r.exec({ filename: "world.txt", outDirname: 'outWorld' }, 300, myObj, useHtml);


