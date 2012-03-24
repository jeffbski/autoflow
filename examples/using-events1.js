'use strict';
/*jshint white: false */

/**
   Default DSL, showing use of events
  */

var react = require('../'); // require('react');
react.trackTasks();  // turn on flow and task tracking events

//output events as tasks start and complete
react.events.on('flow.*', function (obj) {
  /*jshint validthis: true */
  var time = new Date();
  time.setTime(obj.time);
  var argsNoCb = obj.args.filter(function (a) { return (typeof(a) !== 'function'); });
  var eventTimeStr = time.toISOString();
  if (this.event === 'flow.complete') {
    var env = obj; 
    console.error('%s: %s \tmsecs:(%s) \n\targs:(%s) \n\tresults:(%s)\n',
                  this.event, env.name, env.elapsedTime, argsNoCb, env.results);   
  } else {
    var name = obj.name;
    var args = obj.args;
    console.error('%s: %s \n\targs:(%s)\n', this.event, name, argsNoCb);
  }
});

react.events.on('task.*', function (obj) {
  /*jshint validthis: true */
  var time = new Date();
  time.setTime(obj.time);
  var argsNoCb = obj.args.filter(function (a) { return (typeof(a) !== 'function'); });
  var eventTimeStr = time.toISOString();
  if (this.event === 'task.complete') {
    var task = obj;
    console.error('%s: %s \tmsecs:(%s) \n\targs:(%s) \n\tresults:(%s)\n',
                  this.event, task.name, task.elapsedTime, argsNoCb, task.results);
  } else {
    var name = obj.name;
    var args = obj.args;
    console.error('%s: %s \n\targs:(%s)\n', this.event, name, argsNoCb);
  }
});



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


