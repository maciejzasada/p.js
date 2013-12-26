#!/usr/bin/env node
var argv = require('optimist')
    .usage('Optimize a POOF.js modular project.\nUsage: $0')
    .options('i', {
        alias: 'input',
        demand: true,
        describe: 'Application\'s main JavaScript file.'
    })
    .options('o', {
        alias: 'output',
        default: null,
        describe: 'Output file.'
    })
    .options('e', {
        alias: 'embed',
        default: 'none',
        describe: 'Embed POOF.js runtime. [dev|prod|none].'
    })
    .options('minify', {
        default: true,
        boolean: true,
        describe: 'Minify output file.'
    })
    .options('sourcemap', {
        default: false,
        boolean: true,
        describe: 'Generate source map.'
    })
    .options('root', {
        default: null,
        describe: 'JavaScript root directory.'
    })
    .check(function (argv) {
        return ['dev', 'prod', 'none'].indexOf(argv.embed) !== -1;
    })
    .argv;

require('./lib/p.js')(argv);