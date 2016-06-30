'use strict';

const filesize = require('filesize');
const ui = require('cliui')({
    width: 150
});
const chalk = require('chalk');
const utils = require('../utils');


module.exports = {
    buildDiffObject({stats, options}) {
        const result = [];
        const chunksData = {};

        // First construct a map-like object structure of chunk names and their sizes, since it makes
        // life a little bit easier than searching for chunk data in an array.
        stats.forEach((stat, fileIndex) => {

            stat.chunks.filter(chunk => {
                const name = chunk.names[0];
                if (options.names) {
                    return options.names.indexOf(name) > -1;
                } else {
                    return true;
                }
            })
            .forEach(chunk => {
                const name = chunk.names[0];
                const {size, modules} = chunk;
                let data = chunksData[name];

                // Do we have some chunk data already?
                if (!data) {
                    data = chunksData[name] = {
                        chunkSize: [],
                        moduleCount: []
                    };
                }

                const {chunkSize, moduleCount} = data;

                if (fileIndex) {
                    if (!chunkSize[0]) chunkSize[0] = 0;
                    if (!moduleCount[0]) moduleCount[0] = 0;
                }

                moduleCount[fileIndex] = modules.length;
                chunkSize[fileIndex] = size;
            });
        });

        // Convert the object to an array. The order doesn't really matter
        for (const name in chunksData) {
            const {chunkSize, moduleCount} = chunksData[name];
            result.push({name,chunkSize, moduleCount});
        }

        return result;
    },

    buildLogString(sizeData) {

        const header = ['Chunk Name', 'Size before', 'Size after', 'Difference', 'Percentage', 'Modules before', 'Modules after', 'Difference']
            .map((text, index) => {
                return {
                    text: chalk.underline(text),
                    width: index === 0 ? 30 : undefined
                };
            });

        ui.div(...header);

        sizeData
            .sort((before, after) => {
                const beforeAverage = utils.calcPercentageDiff(before.chunkSize[0], before.chunkSize[1]);
                const afterAverage = utils.calcPercentageDiff(after.chunkSize[0], after.chunkSize[1]);

                return beforeAverage - afterAverage;
            })
            .forEach(({name, chunkSize, moduleCount}) => {
                const sizeDifference = chunkSize[1] - chunkSize[0];
                const moduleDifference = moduleCount[1] - moduleCount[0];
                const percentage = Math.round(utils.calcPercentageDiff(chunkSize[0], chunkSize[1]));
                const color = utils.getColor(percentage);

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
                    `${percentage}%`,
                    // Modules before
                    moduleCount[0],
                    // Modules after
                    moduleCount[1],
                    // Module difference
                    moduleDifference
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
