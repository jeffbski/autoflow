'use strict';

/**
   Example setting the AST directly without using define
 */

var reactMod = require(__dirname+'/../lib/react.js');
reactMod.reactOptions.debugOutput = true;
var react = reactMod.react;

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

var r = reactMod.react();
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
r.exec("world.txt", 300, 'outWorld', useHtml);


