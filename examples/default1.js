'use strict';
/*jshint white: false */

var react = require('../'); // require('react');

function loadUser(uid, cb){ setTimeout(cb, 100, null, "User"+uid); }
function loadFile(filename, cb){ setTimeout(cb, 100, null, 'Filedata'+filename); }
function markdown(filedata) { return 'html'+filedata; }
function prepareDirectory(outDirname, cb){ setTimeout(cb, 200, null, 'dircreated-'+outDirname); }
function writeOutput(html, user, cb){  setTimeout(cb, 300, null, html+'_bytesWritten'); }
function loadEmailTemplate(cb) { setTimeout(cb, 50, null, 'emailmd'); }
function customizeEmail(user, emailHtml, cb) { return 'cust-'+user+emailHtml; }
function deliverEmail(custEmailHtml, cb) { setTimeout(cb, 100, null, 'delivered-'+custEmailHtml); }

function useHtml(err, html, user, bytesWritten) {
  if (err) {
    console.log('***Error: %s', err);
    return;
  }
  console.log('final result: %s, user: %s, written:%s', html, user, bytesWritten);
}

// define fn, glue together with react, it will parallelize
// starts with name and in/out params, then the tasks
var loadAndSave = react('loadAndSave', 'fName, uid, outDir, cb -> err, html, user, bytes',  
  loadUser,         'uid              -> err, user',     // calling async loadUser with uid, cb called with err and user
  loadFile,         'filename         -> err, filedata',
  markdown,         'filedata         -> returns html',    // using a sync function
  prepareDirectory, 'outDirname       -> err, dircreated',
  writeOutput,      'html, user       -> err, bytesWritten', { after: prepareDirectory },  // only after prepareDirectory done
  loadEmailTemplate, '                -> err, emailmd',
  markdown,         'emailmd          -> returns emailHtml',   // using a sync function
  customizeEmail,   'user, emailHtml  -> returns custEmailHtml',
  deliverEmail,     'custEmailHtml    -> err, deliveredEmail', { after: writeOutput }  // only after writeOutput is done
);   // callback output params

//in another module you can use this as any other exported fn
loadAndSave('file.md', 100, '/tmp/foo', useHtml);  // executing the flow


