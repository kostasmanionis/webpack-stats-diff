'use strict';

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');
const runReporters = require('./runReporters');

module.exports = () => {

    const compareConfig = {
        reporters: [],
        stats: []
    };

    const {files, chunks, exclude, sort, assets, modules} = require('yargs')
        .alias({
            c: 'chunks',
            e: 'exclude',
            f: 'files',
            s: 'sort',
            a: 'assets',
            m: 'modules'
        })
        .describe({
            c: 'Output chunk diff',
            a: 'Output asset diff',
            f: 'Specify paths to stats files',
            s: 'Asc/desc sort',
            m: 'Output module diff. Accepts chunk name' // Only allowed on chunks
        })
        .default('sort', [])
        .demand('files')
        .help()
        .array(['files', 'sort', 'modules'])
        .boolean('chunks')
        .argv;

    const statsFilesToCompare = files.map(fileName => {
        const filePath = path.join(process.cwd(), fileName);
        return fs.readFileAsync(filePath, 'utf8');
    });

    if (chunks || assets) {
        const reporterName = chunks ? 'chunks' : 'assets';
        compareConfig.reporters.push({
            reporter: reporterName,
            options: {exclude, sort}
        });
    }

    if (modules) {
        compareConfig.reporters.push({
            reporter: 'modules',
            options: {modules}
        });
    }

    Promise.all(statsFilesToCompare)
        .then(result => result.map(stats => JSON.parse(stats)))
        .then(parsedStatsFiles => {
            compareConfig.stats = parsedStatsFiles;
            runReporters(compareConfig);
        });
};
