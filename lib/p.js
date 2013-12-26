#!/usr/bin/env node

// Imports.
var fs = require('fs'),
    path = require('path'),
    http = require('http'),
    https = require('https'),
    processor = require('./processor.js'),
    optimizer = require('./optimizer.js'),
    util = require('./util.js'),

// Constants.
    RUNTIME_PATH = {
        'dev': 'https://raw.github.com/maciejzasada/poof.js/master/build/dev/poof-dev.min.js',
        'prod': 'https://raw.github.com/maciejzasada/poof.js/master/build/prod/poof.min.js',
        'none': null
    },
    TMP_DIR = '.tmp';


/**
 * Export.
 * @param argv
 */
module.exports = function (argv) {

    var output,
        url,
        numReady = 0,
        numTotal = 2,
        files,
        onReady;

    argv.output = argv.output || argv.input.replace('.js', '.p.js');

    // Greet the user.
    console.log('Starting p.js optimization...');

    // Init temp working directory.
    util.deleteFolderRecursive(TMP_DIR);
    fs.mkdirSync(TMP_DIR);

    // Start downloading runtime if embedding (but don't wait for it).
    url = (argv.embed && RUNTIME_PATH[argv.embed]) ? RUNTIME_PATH[argv.embed] : null;
    numReady = url ? 0 : 1;

    if (url) {
        console.log('\\/ Downloading ' + argv.embed + ' runtime (' +  url + ') ...');
        (url.indexOf('https') === -1 ? http : https).get(url, function (res) {
            res.pipe(fs.createWriteStream(path.join(TMP_DIR, '.runtime.js')));
            res.on('end', function () {
                console.log('+  Runtime download complete.');
                if (++numReady === numTotal) {
                    onReady();
                }
            });
        });
    }

    // Process.
    processor.process(argv.input, argv.root || (argv.input.indexOf('/') === -1 ? argv.input : argv.input.substring(0, argv.input.lastIndexOf('/'))), TMP_DIR, function (filePaths) {
        console.log('Processing complete.');
        files = filePaths;
        if (++numReady === numTotal) {
            onReady();
        }
    });

    // Wait for async part (runtime download and processing).
    onReady = function () {
        // Embed runtime.
        if (url) {
            files.splice(0, 0, path.join(TMP_DIR, '.runtime.js'))
        }

        // Optimize.
        console.log('Optimizing...');
        output = optimizer.optimize(files, argv.minify, argv.sourcemap ? (argv.output + '.map') : false, argv.root);

        // Save output.
        fs.writeFileSync(argv.output, output.code);
        fs.writeFileSync(argv.output + '.map', output.map.toString());

        // Remove temp directory.
        util.deleteFolderRecursive(TMP_DIR);

        console.log('Complete.\nOutput saved to', argv.output);
    };

};