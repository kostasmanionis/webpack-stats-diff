'use strict';

const colors = require('chalk');
const ui = require('cliui')({
    width: 150
});

const emptyChunk = {
    modules: []
};

module.exports = {
    buildDiffObject(reporterName, stats, options) {
        const filterByName = names => chunks => chunks.filter(chunk => names.indexOf(chunk.names[0]) > -1);
        const getChunksByName = filterByName(options.modules);

        const buildDiffObject = (chunk = emptyChunk) => {
            if (!chunk.modules) throw new Error('No chunk module data available.')
            return {
                name: chunk.names[0],
                modules: chunk.modules.map(module => module.name)
            }
        };

        const [firstFileModules, secondFileModules] = stats
            // Loop through all the chunks and filter out the only ones we need
            .map(({chunks}) => getChunksByName(chunks))
            // Extract only the data we need for the diff.
            .map(requestedChunks => requestedChunks.map(buildDiffObject));

        const mapModuleDiff = (arr1, arr2) => arr1.map((chunk, index) => {
            return {
                name: chunk.name,
                modules: chunk.modules.filter(name => !arr2[index] || arr2[index].modules.indexOf(name) === -1)
            };
        });

        return {
            addedFiles: mapModuleDiff(secondFileModules, firstFileModules),
            removedFiles: mapModuleDiff(firstFileModules, secondFileModules)
        };
    },

    buildLogString(reporterName, {addedFiles, removedFiles}, options) {
        addedFiles.forEach((addedChunkInfo = emptyChunk, index) => {
            const removedChunkInfo = removedFiles[index] || emptyChunk;
            const {modules: removedModules} = removedChunkInfo;
            const {modules: addedModules} = addedChunkInfo;
            const name = addedChunkInfo.name || removedChunkInfo.name;

            const longestList = addedModules.length > removedModules.length ? addedModules : removedModules;

            ui.div(`Removed files from ${name}`, `Added files ${name}`);

            longestList.forEach((dontNeedThis, index) => {
                const removedModule = removedModules[index] || '';
                const addedModule = addedModules[index] || '';
                ui.div(colors.red(removedModule), colors.green(addedModule));
            });
        });

        return ui.toString();
    }
};
