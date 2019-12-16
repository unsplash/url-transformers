import * as assert from 'assert';
import { pipe, pipeWith } from 'pipe-ts';
import * as urlHelpers from 'url';
import {
    addQueryToUrl,
    appendPathnameToUrl,
    mapParsedUrl,
    mapUrl,
    replaceHashInUrl,
    replacePathInUrl,
    replacePathnameInParsedUrl,
    replacePathnameInUrl,
    replaceQueryInParsedUrl,
    replaceQueryInUrl,
} from './index';

assert.deepEqual(
    pipeWith(
        urlHelpers.parse('https://foo.com/bar', true),
        parsedUrl =>
            mapParsedUrl(({ parsedUrl }) => ({
                ...parsedUrl,
                pathname: '/foo',
                query: { a: 'b' },
            }))({ parsedUrl }),
        urlHelpers.format,
    ),
    'https://foo.com/foo?a=b',
);

assert.deepEqual(
    pipeWith('https://foo.com/bar', url =>
        mapUrl(({ parsedUrl }) => ({
            ...parsedUrl,
            pathname: '/foo',
            query: { a: 'b' },
        }))({ url }),
    ),
    'https://foo.com/foo?a=b',
);

assert.deepEqual(
    pipeWith('https://foo.com/bar', url =>
        mapUrl(
            pipe(
                replacePathnameInParsedUrl({ newPathname: () => '/foo' }),
                parsedUrl =>
                    replaceQueryInParsedUrl({ newQuery: () => ({ a: 'b' }) })({ parsedUrl }),
            ),
        )({ url }),
    ),
    'https://foo.com/foo?a=b',
);

assert.strictEqual(
    replaceQueryInUrl({
        newQuery: { foo: 1 },
    })({
        url: '/foo?string=string&number=1&boolean=true&strings=string1&strings=string2',
    }),
    '/foo?foo=1',
);

assert.strictEqual(
    replaceQueryInUrl({
        newQuery: { foo: 1 },
    })({
        url: 'http://foo.com/?string=string&number=1&boolean=true&strings=string1&strings=string2',
    }),
    'http://foo.com/?foo=1',
);
assert.strictEqual(
    replaceQueryInUrl({
        newQuery: {},
    })({
        url: 'http://foo.com/?string=string&number=1&boolean=true&strings=string1&strings=string2',
    }),
    'http://foo.com/',
);

assert.strictEqual(
    addQueryToUrl({
        queryToAppend: {
            string: 'string',
            number: 1,
            boolean: true,
            strings: ['string1', 'string2'],
        },
    })({ url: 'http://foo.com/' }),
    'http://foo.com/?string=string&number=1&boolean=true&strings=string1&strings=string2',
);
assert.strictEqual(
    addQueryToUrl({
        queryToAppend: { a: 'b' },
    })({ url: 'http://foo:bar@baz.com/' }),
    'http://foo:bar@baz.com/?a=b',
);
assert.strictEqual(
    addQueryToUrl({
        queryToAppend: { c: 'd' },
    })({ url: 'http://foo.com/?a=b&b=c' }),
    'http://foo.com/?a=b&b=c&c=d',
);

assert.strictEqual(
    replacePathInUrl({ newPath: '/bar' })({ url: 'https://foo.com/foo?example' }),
    'https://foo.com/bar',
);
assert.strictEqual(
    replacePathInUrl({ newPath: null })({ url: 'https://foo.com/foo?example' }),
    'https://foo.com',
);

assert.strictEqual(
    replacePathnameInUrl({ newPathname: '/bar' })({ url: 'https://foo.com/foo' }),
    'https://foo.com/bar',
);
assert.strictEqual(
    replacePathnameInUrl({ newPathname: null })({ url: 'https://foo.com/foo' }),
    'https://foo.com',
);
assert.strictEqual(
    replacePathnameInUrl({ newPathname: '/bar' })({ url: 'https://foo.com/foo?example=' }),
    'https://foo.com/bar?example=',
);

assert.strictEqual(appendPathnameToUrl({ pathnameToAppend: '/bar' })({ url: '/foo' }), '/foo/bar');
assert.strictEqual(appendPathnameToUrl({ pathnameToAppend: '/bar' })({ url: '/foo/' }), '/foo/bar');
assert.strictEqual(
    appendPathnameToUrl({ pathnameToAppend: '/bar' })({ url: '/foo?example=' }),
    '/foo/bar?example=',
);
assert.strictEqual(
    appendPathnameToUrl({ pathnameToAppend: '/bar' })({ url: '/@foo' }),
    '/@foo/bar',
);

assert.strictEqual(replaceHashInUrl({ newHash: '#bar' })({ url: '/foo' }), '/foo#bar');
assert.strictEqual(replaceHashInUrl({ newHash: null })({ url: '/foo#bar' }), '/foo');
assert.strictEqual(replaceHashInUrl({ newHash: '#baz' })({ url: '/foo#bar' }), '/foo#baz');
