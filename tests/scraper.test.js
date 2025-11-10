'use strict';

const {
  buildSearchUrl,
  buildLookupUrl
} = require('../src/extractors/appstore_parser');

describe('App Store parser URL builders', () => {
  test('buildSearchUrl builds a valid search URL with encoded term', () => {
    const url = buildSearchUrl({
      term: 'game dev unchained',
      country: 'US',
      media: 'podcast',
      limit: 25
    });

    expect(url.startsWith('https://itunes.apple.com/search?')).toBe(true);
    expect(url).toContain('term=game%20dev%20unchained');
    expect(url).toContain('country=us');
    expect(url).toContain('media=podcast');
    expect(url).toContain('limit=25');
  });

  test('buildSearchUrl uses defaults when optional fields missing', () => {
    const url = buildSearchUrl({
      term: 'x'
    });

    expect(url).toContain('country=us');
    expect(url).toContain('term=x');
  });

  test('buildLookupUrl builds a valid lookup URL for multiple ids', () => {
    const url = buildLookupUrl({
      ids: ['123', '456'],
      country: 'GB',
      media: 'software'
    });

    expect(url.startsWith('https://itunes.apple.com/lookup?')).toBe(true);
    expect(url).toContain('id=123%2C456');
    expect(url).toContain('country=gb');
    expect(url).toContain('media=software');
  });

  test('buildLookupUrl uses default country when not provided', () => {
    const url = buildLookupUrl({
      ids: ['789']
    });

    expect(url).toContain('country=us');
    expect(url).toContain('id=789');
  });
});