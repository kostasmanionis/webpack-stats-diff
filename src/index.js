#!/usr/bin/env node

'use strict';

const runReporters = require('./runReporters');
const runCli = require('./runCli');

// If ran from the command line just DO STUFF!!!!
if (require.main === module) {
    runCli();
}

module.exports = runReporters;
