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


function multiply(a, b, cb) { cb(null, a * b); }
function add(a, b) { return a + b; }

var fn = react.chainDefine()
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
