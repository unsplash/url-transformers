import * as assert from 'assert';
import { pipe, pipeWith } from 'pipe-ts';
import * as urlHelpers from 'url';
import {
    addQueryToUrl,
    appendPathnameToUrl,
    mapParsedUrl,
    mapUrl,
    replaceHashInUrl,
    replacePathInParsedUrl,
    replacePathInUrl,
    replacePathnameInParsedUrl,
    replacePathnameInUrl,
    replaceQueryInParsedUrl,
    replaceQueryInUrl,
} from './index';

assert.deepEqual(
    pipeWith(
        urlHelpers.parse('https://foo.com/bar', true),
        mapParsedUrl(parsedUrl => ({
            ...parsedUrl,
            pathname: '/foo',
            query: { a: 'b' },
        })),
        urlHelpers.format,
    ),
    'https://foo.com/foo?a=b',
);

assert.deepEqual(
    pipeWith(
        'https://foo.com/bar',
        mapUrl(parsedUrl => ({
            ...parsedUrl,
            pathname: '/foo',
            query: { a: 'b' },
        })),
    ),
    'https://foo.com/foo?a=b',
);

assert.deepEqual(
    pipeWith(
        'https://foo.com/bar',
        mapUrl(
            pipe(
                replacePathnameInParsedUrl(() => '/foo'),
                replaceQueryInParsedUrl(() => ({ a: 'b' })),
            ),
        ),
    ),
    'https://foo.com/foo?a=b',
);

assert.strictEqual(
    replaceQueryInUrl({ foo: 1 })(
        '/foo?string=string&number=1&boolean=true&strings=string1&strings=string2',
    ),
    '/foo?foo=1',
);

assert.strictEqual(
    replaceQueryInUrl({ foo: 1 })(
        'http://foo.com/?string=string&number=1&boolean=true&strings=string1&strings=string2',
    ),
    'http://foo.com/?foo=1',
);
assert.strictEqual(
    replaceQueryInUrl({})(
        'http://foo.com/?string=string&number=1&boolean=true&strings=string1&strings=string2',
    ),
    'http://foo.com/',
);

assert.strictEqual(
    addQueryToUrl({
        string: 'string',
        number: 1,
        boolean: true,
        strings: ['string1', 'string2'],
    })('http://foo.com/'),
    'http://foo.com/?string=string&number=1&boolean=true&strings=string1&strings=string2',
);
assert.strictEqual(
    addQueryToUrl({ a: 'b' })('http://foo:bar@baz.com/'),
    'http://foo:bar@baz.com/?a=b',
);
assert.strictEqual(
    addQueryToUrl({ c: 'd' })('http://foo.com/?a=b&b=c'),
    'http://foo.com/?a=b&b=c&c=d',
);

assert.strictEqual(
    pipeWith(
        'https://foo.com/foo?example',
        mapUrl(replacePathInParsedUrl(prev => ({ pathname: `${prev.pathname}/bar`, query: null }))),
    ),
    'https://foo.com/foo/bar',
);
assert.strictEqual(
    pipeWith(
        'https://foo.com/foo?example',
        mapUrl(
            replacePathInParsedUrl(prev => ({
                pathname: `${prev.pathname}/bar`,
                query: prev.query,
            })),
        ),
    ),
    'https://foo.com/foo/bar?example=',
);
assert.strictEqual(
    pipeWith(
        'https://foo.com/foo?example',
        mapUrl(replacePathInParsedUrl({ pathname: null, query: null })),
    ),
    'https://foo.com',
);

assert.strictEqual(
    replacePathInUrl(prev => `${prev}/bar`)('https://foo.com/foo'),
    'https://foo.com/foo/bar',
);
assert.strictEqual(
    replacePathInUrl(prev => `${prev}/bar`)('https://foo.com/foo?example'),
    'https://foo.com/foo?example=%2Fbar',
);
assert.strictEqual(replacePathInUrl('/bar')('https://foo.com/foo?example'), 'https://foo.com/bar');
assert.strictEqual(replacePathInUrl(null)('https://foo.com/foo?example'), 'https://foo.com');

assert.strictEqual(replacePathnameInUrl('/bar')('https://foo.com/foo'), 'https://foo.com/bar');
assert.strictEqual(replacePathnameInUrl(null)('https://foo.com/foo'), 'https://foo.com');
assert.strictEqual(
    replacePathnameInUrl('/bar')('https://foo.com/foo?example='),
    'https://foo.com/bar?example=',
);

assert.strictEqual(appendPathnameToUrl('/bar')('/foo'), '/foo/bar');
assert.strictEqual(appendPathnameToUrl('/bar')('/foo/'), '/foo/bar');
assert.strictEqual(appendPathnameToUrl('/bar')('/foo?example='), '/foo/bar?example=');
assert.strictEqual(appendPathnameToUrl('/bar')('/@foo'), '/@foo/bar');

assert.strictEqual(replaceHashInUrl('#bar')('/foo'), '/foo#bar');
assert.strictEqual(replaceHashInUrl(null)('/foo#bar'), '/foo');
assert.strictEqual(replaceHashInUrl('#baz')('/foo#bar'), '/foo#baz');
assert.strictEqual(replaceHashInUrl(prev => `${prev}2`)('/foo#bar'), '/foo#bar2');
