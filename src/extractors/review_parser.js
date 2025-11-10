'use strict';

const fetch = require('node-fetch');

/**
* Build URL for iTunes RSS customer reviews feed.
* @param {number|string} id
* @param {string} country
* @param {number} page
* @returns {string}
*/
function buildReviewUrl(id, country, page) {
const pageNum = page || 1;
const cc = (country || 'us').toLowerCase();
return `https://itunes.apple.com/rss/customerreviews/page=${pageNum}/id=${id}/sortby=mostrecent/json?cc=${cc}`;
}

/**
* Normalize a single RSS entry object from iTunes to a generic review shape.
* @param {Object} entry
* @returns {Object|null}
*/
function normalizeReviewEntry(entry) {
if (!entry || typeof entry !== 'object') {
return null;
}

const ratingNode = entry['im:rating'];
const titleNode = entry.title;
const contentNode = entry.content;
const versionNode = entry['im:version'];
const authorNode = entry.author;

if (!ratingNode || !ratingNode.label) {
// The first "entry" is often the app's metadata, not an actual review.
return null;
}

return {
userName: authorNode && authorNode.name && authorNode.name.label
? authorNode.name.label
: 'Unknown',
score: Number(ratingNode.label) || 0,
title: titleNode && titleNode.label ? titleNode.label : '',
text: contentNode && contentNode.label ? contentNode.label : '',
version: versionNode && versionNode.label ? versionNode.label : ''
};
}

/**
* Fetch reviews for a given item from the iTunes RSS feed.
* @param {number|string} trackId
* @param {string} [country='us']
* @param {number} [pageLimit=1]
* @returns {Promise<Object[]>}
*/
async function fetchReviewsForItem(trackId, country = 'us', pageLimit = 1) {
const allReviews = [];
const maxPages = Math.max(1, pageLimit);

for (let page = 1; page <= maxPages; page++) {
const url = buildReviewUrl(trackId, country, page);
console.log(`[review_parser] Fetching reviews page ${page}: ${url}`);

const res = await fetch(url);
if (!res.ok) {
console.warn(
`[review_parser] Reviews request failed with status ${res.status} ${res.statusText}`
);
break;
}

const data = await res.json();
const feed = data.feed || {};
const entries = Array.isArray(feed.entry) ? feed.entry : [];

if (!entries.length) {
break;
}

for (const entry of entries) {
const review = normalizeReviewEntry(entry);
if (review) {
allReviews.push(review);
}
}

// If this page returned only metadata and no reviews, stop.
if (allReviews.length === 0 && page === 1) {
break;
}
}

console.log(
`[review_parser] Collected ${allReviews.length} reviews for ${trackId}`
);
return allReviews;
}

module.exports = {
buildReviewUrl,
fetchReviewsForItem,
normalizeReviewEntry
};