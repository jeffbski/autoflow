'use strict';
/*global fail:false, complete:false, desc:false, jake:false, namespace:false, task:false */

var path = require('path');
var child_process = require('child_process');

var REQUIREJS = path.resolve(__dirname, 'node_modules/requirejs/bin/r.js');

desc('Default - build all dist versions');
task('default', ['dist-all'], function (params) { });


function runRequireJs(argStr) {
  var proc = child_process.spawn(REQUIREJS, argStr.split(' '));
  proc.stdout.pipe(process.stdout);
  proc.stderr.pipe(process.stderr);
  proc.on('exit', function (exitCode) {
    if (exitCode !== 0) {
      console.error('Child process exited with error code: %s, exiting', exitCode);
      process.exit(exitCode);
    }
  });
}

desc('Create core single-file developer dist');
task('dist', function () {
  runRequireJs('-o src/dist.build.requirejs out=dist/react.js');
});

desc('Create full single-file minified dist');
task('min', function () {
  runRequireJs('-o src/dist.build.requirejs out=dist/react.min.js optimize=uglify');
});

desc('Create all dist versions');
task('dist-all', ['dist', 'min']);



