'use strict';

const filesize = require('filesize');
const ui = require('cliui')({
    width: 150
});
const chalk = require('chalk');
const utils = require('../utils');
const headerCopy = {
    name: {
        assets: 'Asset name',
        chunks: 'Chunk name'
    },
    size: {
        before: 'Size before',
        after: 'Size after'
    },
    modules: {
        before: 'Modules before',
        after: 'Modules after'
    },
    difference: 'Difference',
    percentage: 'Percentage'
};

const getChunkName = chunk => chunk.name || chunk.names[0];

const mapChunkDiffData = formatFunc => sizeData => {
    const sizeDifference = sizeData[1] - sizeData[0];
    const sizePercentage = Math.round(utils.getChangePercentage(sizeData[0], sizeData[1]));

    return [formatFunc(sizeData[0]), formatFunc(sizeData[1]), formatFunc(sizeDifference), `${sizePercentage}%`];
};

const mapSizeData = mapChunkDiffData(filesize);
const mapModuleData = mapChunkDiffData(value => value);

const getSortValue = (before, after, sortBy) => {
    // By default we're sorting by chunk size
    let sortKey = 'chunkSize';

    if (sortBy.indexOf('modules') > -1) {
        sortKey = 'moduleCount';
    }
    const beforeData = before[sortKey];
    const afterData = after[sortKey];

    // Currently only support sorting by change value
    const sortByBefore = utils.getChange(beforeData[0], beforeData[1]);
    const sortByAfter = utils.getChange(afterData[0], afterData[1]);
    let sortResult = sortByBefore - sortByAfter;

    if (sortBy.indexOf('desc') > -1) {
        sortResult *= -1;
    }

    return sortResult;
};

module.exports = {
    buildDiffObject(reporterName, stats, options) {
        const chunksData = stats.reduce((initial, stat, fileIndex) => {
            return stat[reporterName]
                // First filter out the chunks/assets that we'll be comparing
                .filter(chunk => options.names ? options.names.indexOf(getChunkName(chunk)) > -1 : true)
                // Then reduce the stats to an map-like object, since it makes life a little bit easier than
                // searching for chunk data in an array and is generaly easier to wrap your head around.
                .reduce((chunkMap, chunk) => {
                    const name = getChunkName(chunk);
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

                    if (modules) {
                        moduleCount[fileIndex] = modules.length;
                    }

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

    buildLogString(reporterName, result, options) {

        let showModulesHeader = false;
        let longestName = 0;

        const sortedResult = result
            .sort((before, after) => getSortValue(before, after, options.sort))
            .map(data => {
                const {name, chunkSize, moduleCount} = data;

                // Every row starts with a chunk or asset name
                // For chunks and assets we're always gonna have size data
                let row = [name, ...mapSizeData(chunkSize)];

                // Module data is only available when comparing chunks
                const noModuleData = moduleCount.every(number => number === 0);

                // Names can get long, so we need to adjust the table column width
                // We don't care about non-BMP characters, so it's safe to use length
                if (name.length > longestName) longestName = name.length;

                if (!noModuleData) {
                    // Flag this to include column names for modules
                    showModulesHeader = true;
                    row = row.concat(mapModuleData(moduleCount));
                }

                const color = utils.getColor(utils.getChangePercentage(chunkSize[0], chunkSize[1]));
                return row.map(text => color(text));
            });

        const {name, size, modules, difference, percentage} = headerCopy;
        let header = [name[reporterName], size.before, size.after, difference, percentage];

        if (showModulesHeader) {
            header = header.concat([modules.before, modules.after, difference, percentage]);
        }

        sortedResult.unshift(header.map(text => chalk.underline(text)));

        // Map every array to an object that cliui understands
        sortedResult.forEach(stuff => {
            ui.div(...stuff.map((text, index) => {
                const width = index === 0 ? longestName + 1 : undefined;
                return {text, width};
            }));
        });

        return ui.toString();
    }
};
