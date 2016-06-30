'use strict';

const chalk = require('chalk');

module.exports = {
    calcNumDiff(a, b) {
        return (b - a) / b;
    },

    calcPercentageDiff(a, b) {
        return this.calcNumDiff(a, b) * 100;
    },

    getColor(num) {
        if (num < -30) return chalk.bold.green
        else if (num < -20) return chalk.green
        else if (num < -10) return chalk.dim.bold.green
        else if (num < 0) return chalk.dim.green
        else if (num === 0) return chalk.dim
        else if (num < 10) return chalk.dim.bold.yellow
        else if (num < 20) return chalk.dim.red
        else if (num < 30) return chalk.dim.bold.red
        else if (num < 40) return chalk.red
        else if (num <= 100) return chalk.bold.red
        else return chalk.dim;
    }
};
