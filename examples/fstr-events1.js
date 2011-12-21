'use strict';

var react = require('../'); // require('react');

//output events as tasks start and complete
react.events.on('*', function (obj) {
  var time = new Date();
  time.setTime(obj.time);
  var eventTimeStr = time.toISOString();
  var argsNoCb = obj.args.filter(function (a) { return (typeof(a) !== 'function'); });
  if (obj.event === 'task.complete') {
    console.error('%s: %s \tmsecs:(%s) \n\targs:(%s) \n\tresults:(%s)\n',
                  obj.event, obj.name, obj.elapsedTime, argsNoCb, obj.results);
  } else {
    console.error('%s: %s \n\targs:(%s)\n', obj.event, obj.name, argsNoCb);
  }
});
                

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


