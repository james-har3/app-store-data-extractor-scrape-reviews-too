'use strict';

const fs = require('fs');
const path = require('path');
const {
searchMedia,
lookupMedia
} = require('./extractors/appstore_parser');
const { exportToFile } = require('./outputs/exporter');

function parseArgs(argv) {
const args = {};
for (let i = 2; i < argv.length; i++) {
const token = argv[i];
if (token.startsWith('--')) {
const [key, value] = token.replace(/^--/, '').split('=');
if (typeof value === 'undefined') {
const next = argv[i + 1];
if (!next || next.startsWith('--')) {
args[key] = true;
} else {
args[key] = next;
i++;
}
} else {
args[key] = value;
}
}
}
return args;
}

function loadJson(filePath) {
const absolute = path.resolve(filePath);
if (!fs.existsSync(absolute)) {
throw new Error(`Input JSON file not found at ${absolute}`);
}
const raw = fs.readFileSync(absolute, 'utf8');
try {
return JSON.parse(raw);
} catch (err) {
throw new Error(`Failed to parse JSON from ${absolute}: ${err.message}`);
}
}

function loadDefaultSettings() {
const configPath = path.resolve(__dirname, 'config', 'settings.example.json');
if (!fs.existsSync(configPath)) {
return {};
}
try {
const raw = fs.readFileSync(configPath, 'utf8');
return JSON.parse(raw);
} catch (err) {
console.warn(`Could not read default settings: ${err.message}`);
return {};
}
}

async function run() {
try {
const args = parseArgs(process.argv);
const inputPath =
args.input || path.join(__dirname, '..', 'data', 'sample_input.json');
const outputPath =
args.output || path.join(__dirname, '..', 'data', 'output_sample.json');

const defaults = loadDefaultSettings();
const userConfig = loadJson(inputPath);

const config = {
...defaults,
...userConfig
};

if (!config.mode || !['search', 'lookup'].includes(config.mode)) {
throw new Error(
`Invalid or missing "mode" in input. Expected "search" or "lookup".`
);
}

console.log(`[runner] Starting in "${config.mode}" mode`);
let result;

if (config.mode === 'search') {
if (!config.term || typeof config.term !== 'string') {
throw new Error(
'Search mode requires a non-empty "term" string in the input JSON.'
);
}
result = await searchMedia({
term: config.term,
country: config.country || defaults.defaultCountry,
media: config.media || defaults.defaultMedia,
limit: config.maxItems || defaults.maxItems,
includeReviews:
typeof config.includeReviews === 'boolean'
? config.includeReviews
: defaults.includeReviews,
reviewPageLimit: config.reviewPageLimit || defaults.reviewPageLimit
});
} else {
// lookup
let ids = [];
if (Array.isArray(config.ids)) {
ids = config.ids;
} else if (config.id) {
ids = [config.id];
}
if (!ids.length) {
throw new Error(
'Lookup mode requires either "id" or "ids" in the input JSON.'
);
}

result = await lookupMedia({
ids,
country: config.country || defaults.defaultCountry,
media: config.media || defaults.defaultMedia,
includeReviews:
typeof config.includeReviews === 'boolean'
? config.includeReviews
: defaults.includeReviews,
reviewPageLimit: config.reviewPageLimit || defaults.reviewPageLimit
});
}

await exportToFile(outputPath, result);
console.log(`[runner] Exported ${Array.isArray(result) ? result.length : 0} records to ${outputPath}`);
} catch (err) {
console.error('[runner] Fatal error:', err.message);
process.exitCode = 1;
}
}

if (require.main === module) {
run();
}