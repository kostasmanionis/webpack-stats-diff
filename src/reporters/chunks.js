'use strict';

const filesize = require('filesize');
const ui = require('cliui')({
    width: 150
});
const chalk = require('chalk');
const utils = require('../utils');
const CHUNK_NAME_COLUMN_WIDTH = 25;

module.exports = {
    buildDiffObject({stats, options}) {
        // First reduce the stats to an map-like object, since it makes life a little bit easier than
        // searching for chunk data in an array and is generaly easier to wrap your head around.
        const chunksData = stats.reduce((initial, stat, fileIndex) => {
            return stat.chunks
                .filter(chunk => {
                    const name = chunk.names[0];
                    const requestedChunkNames = options.names;
                    return requestedChunkNames ? requestedChunkNames.indexOf(name) > -1 : true;
                })
                .reduce((chunkMap, chunk) => {
                    const name = chunk.names[0];
                    let data = chunkMap[name];

                    // Do we have some chunk data alrea8dy?
                    if (!data) {
                        data = chunkMap[name] = {
                            chunkSize: [0, 0],
                            moduleCount: [0, 0]
                        };
                    }

                    const {chunkSize, moduleCount} = data;
                    const {size, modules} = chunk;

                    moduleCount[fileIndex] = modules.length;
                    chunkSize[fileIndex] = size;

                    return chunkMap;
                }, initial);
        }, Object.create(null));

        // Convert the object to an array. The order doesn't really matter.
        const result = [];

        for (const name in chunksData) {
            const {chunkSize, moduleCount} = chunksData[name];
            result.push({name, chunkSize, moduleCount});
        }

        return result;
    },

    buildLogString({result, options}) {

        const header = [
            'Chunk Name',
            'Size before',
            'Size after',
            'Difference',
            'Change',
            'Modules before',
            'Modules after',
            'Difference',
            'Change'
        ].map(text => chalk.underline(text));

        const sortedResult = result
            .sort((before, after) => {
                // By default we're sorting by chunk size
                let sortKey = 'chunkSize';

                if (options.sort.indexOf('modules') > -1) {
                    sortKey = 'moduleCount';
                }
                const beforeData = before[sortKey];
                const afterData = after[sortKey];

                // Currently only support sorting by change value
                const sortByBefore = utils.getChange(beforeData[0], beforeData[1]);
                const sortByAfter = utils.getChange(afterData[0], afterData[1]);
                let sortResult = sortByBefore - sortByAfter;

                if (options.sort.indexOf('desc') > -1) {
                    sortResult *= -1;
                }

                return sortResult;
            })
            .map(({name, chunkSize, moduleCount}) => {
                const sizeDifference = chunkSize[1] - chunkSize[0];
                const moduleDifference = moduleCount[1] - moduleCount[0];
                const sizePercentage = Math.round(utils.getChangePercentage(chunkSize[0], chunkSize[1]));
                const modulePercentage = Math.round(utils.getChangePercentage(moduleCount[0], moduleCount[1]));
                const color = utils.getColor(sizePercentage);

                return [
                    // Chunk name
                    name,
                    // Size before
                    filesize(chunkSize[0]),
                    // Size after
                    filesize(chunkSize[1]),
                    // Size difference
                    filesize(sizeDifference),
                    // Size difference in percents
                    `${sizePercentage}%`,
                    // Modules before
                    moduleCount[0],
                    // Modules after
                    moduleCount[1],
                    // Module difference
                    moduleDifference,
                    // Module Percentage
                    `${modulePercentage}%`
                ].map(text => color(text));
            });

        sortedResult.unshift(header);
        sortedResult.forEach(stuff => {
            ui.div(...stuff.map((text, index) => {
                const width = index === 0 ? CHUNK_NAME_COLUMN_WIDTH : undefined;
                return {text, width};
            }));
        });

        return ui.toString();
    }
};
