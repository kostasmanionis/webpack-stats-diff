'use strict';

const chalk = require('chalk');

const utils = {
    getChange(a, b) {
        return (b - a) / b;
    },

    getChangePercentage(a, b) {
        return this.getChange(a, b) * 100;
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
    },

    findChunkHashById(id, chunks) {
        const findChunkById = chunks.find(chunk => id === chunk.id); // Might return undefined
        return findChunkById && findChunkById.hash || '';
    },

    normalizeChunkName(chunk, statObject) {
        // Looping through chunks
        if (chunk.chunkNames && chunk.chunkNames[0]) {
            // TODO: Handle compilation hash & chunk id
            const hash = utils.findChunkHashById(chunk.chunks[0], statObject.chunks) || '';
            return chunk.name.replace(hash, '');
        } else {
            return chunk.names[0];
        }
    }
};

module.exports = utils;
