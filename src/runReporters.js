'use strict';

const differs = require('./reporters');

const run = (name, options, stats) => {
    const differ = differs[name];
    const result = differ.buildDiffObject({stats, options});
    const log = differ.buildLogString({result, options});
    console.log(log);
};

module.exports = config => {
    const {reporters, stats} = config;
    if (Array.isArray(reporters)) {
        reporters.forEach(({reporter, options}) => run(reporter, options, stats));
    } else {
        const {reporter, options} = reporters;
        run(reporter, options, stats);
    }
};
