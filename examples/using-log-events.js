'use strict';
/*jshint white: false */

/**
   Default DSL, showing use of events
  */

var react = require('../'); // require('react');
react.logEvents(); // turn on logging of all flow and task events for all react functions


function loadUser(uid, cb){ setTimeout(cb, 100, null, "User"+uid); }
function loadFile(filename, cb){ setTimeout(cb, 100, null, 'Filedata'+filename); }
function markdown(filedata) { return 'html'+filedata; }
function prepareDirectory(outDirname, cb){ setTimeout(cb, 200, null, 'dircreated-'+outDirname); }
function writeOutput(html, user, cb){  setTimeout(cb, 300, null, html+'_bytesWritten'); }
function loadEmailTemplate(cb) { setTimeout(cb, 50, null, 'emailmd'); }
function customizeEmail(user, emailHtml) { return 'cust-'+user+emailHtml; }
function deliverEmail(custEmailHtml, cb) { setTimeout(cb, 100, null, 'delivered-'+custEmailHtml); }

function useHtml(err, html, user, bytesWritten) {
  if (err) {
    console.log('***Error: %s', err);
    return;
  }
  console.log('final result: %s, user: %s, written:%s', html, user, bytesWritten);
}

var loadAndSave = react('loadAndSave', 'filename, uid, outDirname, cb -> err, html, user, bytesWritten',  // name, in/out params
  loadUser,         'uid, cb          -> err, user',     // calling async fn loadUser with uid, callback is called with err and user
  loadFile,         'filename, cb     -> err, filedata',
  markdown,         'filedata         -> html',    // using a sync function
  prepareDirectory, 'outDirname, cb   -> err, dircreated',
  writeOutput,      'html, user, cb   -> err, bytesWritten', { after: prepareDirectory },  // only after prepareDirectory done
  loadEmailTemplate, 'cb              -> err, emailmd',
  markdown,         'emailmd          -> emailHtml',   // using a sync function
  customizeEmail,   'user, emailHtml  -> custEmailHtml', // sync fn
  deliverEmail,     'custEmailHtml, cb -> err, deliveredEmail', { after: writeOutput }  // only after writeOutput is done
);

loadAndSave('file.md', 100, '/tmp/foo', useHtml);  // executing the flow


