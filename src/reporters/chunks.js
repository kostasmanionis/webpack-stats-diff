'use strict';

const filesize = require('filesize');
const ui = require('cliui')({
    width: 150
});
const chalk = require('chalk');
const utils = require('../utils');

const DATA_KEY_MAP = {
    modules: 'moduleCount',
    size: 'chunkSize'
};

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

        // Convert the object to an array. The order doesn't really matter
        const result = [];

        for (const name in chunksData) {
            const {chunkSize, moduleCount} = chunksData[name];
            result.push({name, chunkSize, moduleCount});
        }

        return result;
    },

    buildLogString({result, options}) {

        const header = ['Chunk Name', 'Size before', 'Size after', 'Difference', 'Percentage', 'Modules before', 'Modules after', 'Difference']
            .map((text, index) => {
                return {
                    text: chalk.underline(text),
                    width: index === 0 ? 30 : undefined
                };
            });

        ui.div(...header);

        const sortedResult = result.sort((before, after) => {
            const sortKey = DATA_KEY_MAP[options.sortBy] || DATA_KEY_MAP.size;
            const sortByBefore = before[sortKey];
            const sortByAfter = after[sortKey];

            const beforeAverage = utils.calcNumDiff(sortByBefore[0], sortByBefore[1]);
            const afterAverage = utils.calcNumDiff(sortByAfter[0], sortByAfter[1]);

            return beforeAverage - afterAverage;
        });

        if (options.sort === 'desc') {
            sortedResult.reverse();
        }

        sortedResult.forEach(({name, chunkSize, moduleCount}) => {
            const sizeDifference = chunkSize[1] - chunkSize[0];
            const moduleDifference = moduleCount[1] - moduleCount[0];
            const sizePercentage = Math.round(utils.calcPercentageDiff(chunkSize[0], chunkSize[1]));
            const modulePercentage = Math.round(utils.calcPercentageDiff(moduleCount[0], moduleCount[1]));
            const color = utils.getColor(sizePercentage);

            const formattedd = [
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
                `${modulePercentage}`
            ].map(text => color(text));

            const nameColumn = {
                text: formattedd.shift(),
                width: 30
            };

            ui.div(nameColumn, ...formattedd);
        });

        return ui.toString();
    }
};
