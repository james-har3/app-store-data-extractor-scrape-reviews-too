'use strict';

const fs = require('fs');
const path = require('path');

/**
* Write the result dataset to a JSON file.
* @param {string} outputPath
* @param {any} data
* @returns {Promise<void>}
*/
async function exportToFile(outputPath, data) {
return new Promise((resolve, reject) => {
try {
const absolute = path.resolve(outputPath);
const dir = path.dirname(absolute);
if (!fs.existsSync(dir)) {
fs.mkdirSync(dir, { recursive: true });
}

const json = JSON.stringify(data, null, 2);
fs.writeFile(absolute, json, 'utf8', (err) => {
if (err) {
console.error('[exporter] Failed to write output file:', err.message);
reject(err);
} else {
console.log('[exporter] Output written to', absolute);
resolve();
}
});
} catch (err) {
console.error('[exporter] Unexpected error while exporting:', err.message);
reject(err);
}
});
}

module.exports = {
exportToFile
};