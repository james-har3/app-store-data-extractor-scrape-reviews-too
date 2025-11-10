'use strict';

const fetch = require('node-fetch');
const { fetchReviewsForItem } = require('./review_parser');

/**
* Build the URL for iTunes Search API.
* @param {Object} opts
* @param {string} opts.term
* @param {string} [opts.country]
* @param {string} [opts.media]
* @param {number} [opts.limit]
* @returns {string}
*/
function buildSearchUrl(opts) {
const term = encodeURIComponent(opts.term || '');
const params = new URLSearchParams();
params.set('term', term);
params.set('country', (opts.country || 'us').toLowerCase());
if (opts.media) {
params.set('media', opts.media);
}
if (opts.limit) {
params.set('limit', String(opts.limit));
}
return `https://itunes.apple.com/search?${params.toString()}`;
}

/**
* Build the URL for iTunes Lookup API.
* @param {Object} opts
* @param {string[]} opts.ids
* @param {string} [opts.country]
* @param {string} [opts.media]
* @returns {string}
*/
function buildLookupUrl(opts) {
const params = new URLSearchParams();
params.set('id', (opts.ids || []).join(','));
params.set('country', (opts.country || 'us').toLowerCase());
if (opts.media) {
params.set('media', opts.media);
}
return `https://itunes.apple.com/lookup?${params.toString()}`;
}

/**
* Perform a search against the iTunes Search API.
* @param {Object} opts
* @param {string} opts.term
* @param {string} [opts.country]
* @param {string} [opts.media]
* @param {number} [opts.limit]
* @param {boolean} [opts.includeReviews]
* @param {number} [opts.reviewPageLimit]
* @returns {Promise<Object[]>}
*/
async function searchMedia(opts) {
const url = buildSearchUrl(opts);
console.log(`[appstore_parser] Search URL: ${url}`);

const res = await fetch(url);
if (!res.ok) {
throw new Error(
`Search request failed with status ${res.status} ${res.statusText}`
);
}

const payload = await res.json();
let results = Array.isArray(payload.results) ? payload.results : [];
console.log(
`[appstore_parser] Received ${results.length} search results from API`
);

if (opts.includeReviews) {
results = await attachReviews(results, {
country: opts.country,
reviewPageLimit: opts.reviewPageLimit
});
}

return results;
}

/**
* Perform a lookup for one or more IDs against the iTunes Lookup API.
* @param {Object} opts
* @param {string[]} opts.ids
* @param {string} [opts.country]
* @param {string} [opts.media]
* @param {boolean} [opts.includeReviews]
* @param {number} [opts.reviewPageLimit]
* @returns {Promise<Object[]>}
*/
async function lookupMedia(opts) {
const url = buildLookupUrl(opts);
console.log(`[appstore_parser] Lookup URL: ${url}`);

const res = await fetch(url);
if (!res.ok) {
throw new Error(
`Lookup request failed with status ${res.status} ${res.statusText}`
);
}

const payload = await res.json();
let results = Array.isArray(payload.results) ? payload.results : [];
console.log(
`[appstore_parser] Received ${results.length} lookup results from API`
);

if (opts.includeReviews) {
results = await attachReviews(results, {
country: opts.country,
reviewPageLimit: opts.reviewPageLimit
});
}

return results;
}

/**
* Attach user reviews to each result using the RSS customer reviews feed.
* Mutates the result objects by adding a `reviews` array.
* @param {Object[]} items
* @param {Object} opts
* @param {string} [opts.country]
* @param {number} [opts.reviewPageLimit]
* @returns {Promise<Object[]>}
*/
async function attachReviews(items, opts) {
const country = opts.country || 'us';
const reviewPageLimit = typeof opts.reviewPageLimit === 'number'
? opts.reviewPageLimit
: 1;

const enriched = [];
for (const item of items) {
const trackId = item.trackId || item.collectionId;
if (!trackId) {
enriched.push(item);
continue;
}

try {
const reviews = await fetchReviewsForItem(trackId, country, reviewPageLimit);
item.reviews = reviews;
} catch (err) {
console.warn(
`[appstore_parser] Failed to fetch reviews for ${trackId}: ${err.message}`
);
item.reviews = [];
}

enriched.push(item);
}

return enriched;
}

module.exports = {
buildSearchUrl,
buildLookupUrl,
searchMedia,
lookupMedia
};