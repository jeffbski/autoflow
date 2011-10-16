var util = require('util');
var jsp = require('/Users/barczewskij/projects/UglifyJS/lib/parse-js.js');

/**
   @example
   var r = react(
     ['filename', 'uid'],
     { f:loadUser,   a:['uid'],               cb:['user']     },
     { f:loadFile,   a:['filename'],          cb:['filedata'] },
     { f:sendOutput, a:['filedata','user'],   cb:['html']     },
     ['html']
   );
   r.exec(filename, uid, function(err, html){
     //use html
   });

   @example
   var r = react(
     ['filename', 'uid'],
     [loadUser, ['uid'],                   ['user']],
     [loadFile, ['filename'],              ['filedata']],
     [sendOutput, ['filedata', 'user'],    ['html']],
     'callback(html)'
   );
   r.exec(filename, uid, function(err, html){
     //use html
   });
   
   
   @example
   var r = react(
     'input(filename, uid)',
     'loadUser(uid, cb_user)',
     'loadFile(filename, cb_filedata)',
     'sendOutput(filedata, user, cb_html)',
     'callback(html)'
   );
   r.exec(filename, uid, function(err, html){
     //use html
   });

   @example
   var r = react(
     'input(dir, uid)',
     'loadUser(uid, cb_user)',
     'findFiles(dir, ev_filename, ev_count)',
     'loadFile(on_filename, ev_filedata)',  
     'writeFile(on_filedata)',
     'writeSummaryPage(on_count, cb_html)',
     'callback(html)'
   );
   r.exec(filename, uid, function(err, html){
     //use html
   });

   @example
   var r = react(function(filename, uid, cb_html){
     var user, filedata, html;
     loadUser(uid, cb_user);
     loadFile(filename, cb_filedata);
     sendOutput(filedata, user, cb_html);
     cb_html(html);
   }); 
   r.exec(filename, uid, function(err, html){
     //use html
   });

   @example
   var r = react(function(dir, uid, cb_html){
     var user, filedata, html;
     loadUser(uid, cb_user);
     readDir(dir, cb_filedata);
     sendOutput(filedata, user, cb_html);
     cb_html(html);
   }); 
   r.exec(filename, uid, function(err, html){
     //use html
   });
   
 */
function react(){
  
  var tasks = Array.prototype.slice.call(arguments);
  var initialInputs = tasks.shift();
  var finalOutputs = tasks.pop();
  var v = { }; //variable context
  var cbExec;
  var _createCallback, _contExec;
  
    _createCallback = function _createCallback(task){
      return function(err){
        var args = Array.prototype.slice.call(arguments,1);
        task.cb.forEach(function(k,idx){
          v[k] = (args[idx] !== undefined) ? args[idx] : null; //upgrade any undefined to null
        });
        task.status = 'complete';
        _contExec();  
      };
    };
  
    _contExec = function _contExec(){
      var tasksToRun = tasks.filter(function(t){ return (!t.status); }); //find tasks left to run
      if(tasksToRun.length === 0){ //we are done, call final callback
        var args = finalOutputs.map(function(k){ return v[k]; });
        args.unshift(null); //err
        cbExec.apply(null, args);
        return;
      }

      //if we are here then we stil have tasks to run
      var tasksReady = tasks.filter(function(t, idx, arr){
        return !t.status && t.a.every(function(k){ return (v[k] !== undefined); }); //true if ready
      });
      tasksReady.forEach(function(t){ t.status = 'ready'; }); //set them all to ready, before running
      tasksReady.forEach(function(t){
        t.status = 'running';
        var args = t.a.map(function(k){ return v[k]; });
        args.push(_createCallback(t));
        t.f.apply(null, args);
      });
    };

    function exec(){
      var args = Array.prototype.slice.call(arguments);
      cbExec = args.pop();
      args.forEach(function(x, idx){ v[initialInputs[idx]] = x; });
      _contExec();
    }
  
  var reactObj = {
    exec: exec
  };
  
  return reactObj;
}



   function loadUser(uid, cbUser){  cbUser(null, "Jeff"); }
   function loadFile(filename, cbFiledata){  cbFiledata(null, "Hello"); }
   function sendOutput(filedata, user, cbHtml){  cbHtml(null, "Foo"); }

   var r = react(
     ['filename', 'uid'],
     { f:loadUser,   a:['uid'],               cb:['user']     },
     { f:loadFile,   a:['filename'],          cb:['filedata'] },
     { f:sendOutput, a:['filedata','user'],   cb:['html']     },
     ['html']
   );

   r.exec("hello.txt", 100, function(err, html){
     console.log("final result = "+html);
   });   


/*
  function readDir(dir, cb_filenames){  }
  function writeSummary(filenames, user, cb_html){  }

   var r = react(function(dir, uid, cb_html){
     var user, filenames, filedata_arr, html; //these will be set as the callbacks run
     loadUser(uid, r.cb_user);
     readDir(dir, r.cb_filenames);
     filenames.forEach(loadFile); //nothing to save
     filedata_arr = filenames.map(loadFile); //save the results, loadFile(filename, cb_filedata)
     r.wait();     
     writeSummary(filenames, user, cb_html);
     cb_html(html);
   }); 
   r.exec("hellodir", 100, function(err, html){
     //use html
   });
*/

/*
var foo = function(dir, uid, cb_html){
     var user, filenames, filedata_arr, html; //these will be set as the callbacks run
   function loadUser(uid, cbUser){  cbUser(null, "Jeff"); }
   function loadFile(filename, cbFiledata){  cbFiledata(null, "Hello"); }
   function sendOutput(filedata, user, cbHtml){  cbHtml(null, "Foo"); }

   function readDir(dir, cb_filenames){  }
   function writeSummary(filenames, user, cb_html){  }
  
     loadUser(uid, r.cb_user);
     readDir(dir, r.cb_filenames);
     r.map(filenames, loadFile, r.cb_filedata_arr);
     r.wait();     
     writeSummary(filedata_arr, user, cb_html);
     cb_html(html);
};

//console.log(foo.toString());
var ast = jsp.parse("var foo = "+foo.toString());
console.log(util.inspect(ast));

*/

