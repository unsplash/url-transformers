import * as assert from 'assert';
import {
    addQueryToUrl,
    appendPathnameToUrl,
    replaceHashInUrl,
    replacePathInUrl,
    replacePathnameInUrl,
} from './index';

assert.strictEqual(
    addQueryToUrl({ url: 'http://foo.com/' })({ queryToAppend: { a: 'b', number: 1 } }),
    'http://foo.com/?a=b&number=1',
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
    replacePathnameInUrl({ url: 'https://foo.com/foo' })({ newPathname: '/bar' }),
    'https://foo.com/bar',
);
assert.strictEqual(
    replacePathnameInUrl({ url: 'https://foo.com/foo?example' })({ newPathname: '/bar' }),
    'https://foo.com/bar?example',
);

assert.strictEqual(appendPathnameToUrl({ url: '/foo' })({ pathnameToAppend: '/bar' }), '/foo/bar');
assert.strictEqual(
    appendPathnameToUrl({ url: '/foo?example' })({ pathnameToAppend: '/bar' }),
    '/foo/bar?example',
);
assert.strictEqual(
    appendPathnameToUrl({ url: '/@foo' })({ pathnameToAppend: '/bar' }),
    '/@foo/bar',
);

assert.strictEqual(replaceHashInUrl({ url: '/foo' })({ newHash: '#bar' }), '/foo#bar');
assert.strictEqual(replaceHashInUrl({ url: '/foo#bar' })({ newHash: undefined }), '/foo');
assert.strictEqual(replaceHashInUrl({ url: '/foo#bar' })({ newHash: '#baz' }), '/foo#baz');
