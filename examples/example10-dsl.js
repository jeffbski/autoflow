

var reactMod = require(__dirname+'/../lib/react.js'); 
var react = reactMod.react;

var r = react('allStart, titlesFile, numQueries, numFactors, cb').define(
    openTitlesStream, 'titlesFile         -> err, fileStream', { tasks: [
      split,          'fileStream         -> err, lineStream',
      filterLines,    'lineStream, numQueries -> err, filteredLineStream',
      trimLines,      'filteredLineStream -> err, trimmedLineStream',
      recordTime,     '                   -> returns qStart', { after: trimLines },
      runQuery,       'trimmedLineStream, numFactors -> err, qResults', { after: recordTime },
      calcTime,       'qStart             -> returns qTime', { after: runQuery },
      sumTotal,       'qTime              -> returns qTotal', { reduce: true }
    ], cb:'-> err, qTotal' },
    calcTime,         'allStart           -> returns allElapsed', { after: openTitlesStream }
  ).callbackDef('allElapsed, qTotal, numQueries, numFactors');



//new simpler syntax

var react = require('react');

var loadAndSave = react('allStart, titlesFile, numQueries, numFactors, cb',
                        foo, 'bar -> err, baz',
                        cat, 'baz -> err, zoo',
                        '-> err, allElapse, qTotal');

var loadAndSave = react('allStart, titlesFile, numQueries, numFactors, cb', [
                        foo, 'bar -> err, baz',
                        cat, 'baz -> returns zoo'
                        ], 'err, allElapse, qTotal');

var loadAndSave = react('allStart, titlesFile, numQueries, numFactors, cb', [
                        foo, 'bar => err, baz',
                        cat, 'baz -> returns zoo'
                        ], 'err, allElapse, qTotal');

var loadAndSave = react('allStart, titlesFile, numQueries, numFactors, cb', [
                        foo, 'bar -> err, baz',
                        'zoo <- ', cat, 'baz',
                        ], 'err, allElapse, qTotal');



var loadAndSave = react('allStart, titlesFile, numQueries, numFactors, cb -> err, allElapse, qTotal',
                        foo, 'bar -> err, baz',
                        cat, 'baz -> err, zoo');
loadAndSave(1, 2, 3, cb);

OR using AST

var loadAndSave = react();
loadAndSave.ast.inputs(['one', 'two'])
   .tasks({ })
   .outTask({ });

loadAndSave(1,2,cb);




