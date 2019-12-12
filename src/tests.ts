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
        url: 'http://foo.com/?string=string&number=1&boolean=true&strings=string1&strings=string2',
    })({
        newQuery: { foo: 1 },
    }),
    'http://foo.com/?foo=1',
);
assert.strictEqual(
    replaceQueryInUrl({
        url: 'http://foo.com/?string=string&number=1&boolean=true&strings=string1&strings=string2',
    })({
        newQuery: {},
    }),
    'http://foo.com/',
);

assert.strictEqual(
    addQueryToUrl({ url: 'http://foo.com/' })({
        queryToAppend: {
            string: 'string',
            number: 1,
            boolean: true,
            strings: ['string1', 'string2'],
        },
    }),
    'http://foo.com/?string=string&number=1&boolean=true&strings=string1&strings=string2',
);
assert.strictEqual(
    addQueryToUrl({ url: 'http://foo:bar@baz.com/' })({
        queryToAppend: { a: 'b' },
    }),
    'http://foo:bar@baz.com/?a=b',
);
assert.strictEqual(
    addQueryToUrl({ url: 'http://foo.com/?a=b&b=c' })({
        queryToAppend: { c: 'd' },
    }),
    'http://foo.com/?a=b&b=c&c=d',
);

assert.strictEqual(
    replacePathInUrl({ url: 'https://foo.com/foo?example' })({ newPath: '/bar' }),
    'https://foo.com/bar',
);
assert.strictEqual(
    replacePathInUrl({ url: 'https://foo.com/foo?example' })({ newPath: null }),
    'https://foo.com',
);

assert.strictEqual(
    replacePathnameInUrl({ url: 'https://foo.com/foo' })({ newPathname: '/bar' }),
    'https://foo.com/bar',
);
assert.strictEqual(
    replacePathnameInUrl({ url: 'https://foo.com/foo' })({ newPathname: null }),
    'https://foo.com',
);
assert.strictEqual(
    replacePathnameInUrl({ url: 'https://foo.com/foo?example=' })({ newPathname: '/bar' }),
    'https://foo.com/bar?example=',
);

assert.strictEqual(appendPathnameToUrl({ url: '/foo' })({ pathnameToAppend: '/bar' }), '/foo/bar');
assert.strictEqual(appendPathnameToUrl({ url: '/foo/' })({ pathnameToAppend: '/bar' }), '/foo/bar');
assert.strictEqual(
    appendPathnameToUrl({ url: '/foo?example=' })({ pathnameToAppend: '/bar' }),
    '/foo/bar?example=',
);
assert.strictEqual(
    appendPathnameToUrl({ url: '/@foo' })({ pathnameToAppend: '/bar' }),
    '/@foo/bar',
);

assert.strictEqual(replaceHashInUrl({ url: '/foo' })({ newHash: '#bar' }), '/foo#bar');
assert.strictEqual(replaceHashInUrl({ url: '/foo#bar' })({ newHash: null }), '/foo');
assert.strictEqual(replaceHashInUrl({ url: '/foo#bar' })({ newHash: '#baz' }), '/foo#baz');
