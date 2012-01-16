'use strict';

var chainDefine = require('../dsl/chain'); // require('react/dsl/chain');
require('../lib/track-tasks');  // require('react/lib/track-tasks'); // turn on tracking

//output events as tasks start and complete
chainDefine.events.on('flow.*', function (obj) {
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

chainDefine.events.on('task.*', function (obj) {
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

function multiply(a, b, cb) { cb(null, a * b); }
function add(a, b) { return a + b; }

var fn = chainDefine()
  .in('a', 'b', 'cb')                                   // input params
  .out('err', 'm', 's')                                 // final callback output params
  .async(multiply).in('a', 'b', 'cb').out('err', 'm')   // task def - async fn, in params, callback out params
  .sync(add).in('m', 'a').out('s')                      // task def - sync fn, in params, return value
  .end();

fn(2, 3, function (err, m, s) {
  console.error('err:', err); // null
  console.error('m:', m);  // 2 * 3 = 6
  console.error('s:', s);  // 6 + 2 = 8
});
