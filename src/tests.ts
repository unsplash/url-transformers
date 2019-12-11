import * as assert from 'assert';
import {
    addQueryToUrl,
    appendPathnameToUrl,
    replaceHashInUrl,
    replacePathInUrl,
    replacePathnameInUrl,
    replaceQueryInUrl,
} from './index';

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
    replaceQueryInUrl(() => ({ foo: 1 }))(
        'http://foo.com/?string=string&number=1&boolean=true&strings=string1&strings=string2',
    ),
    'http://foo.com/?foo=1',
);
assert.strictEqual(
    replaceQueryInUrl(() => ({}))(
        'http://foo.com/?string=string&number=1&boolean=true&strings=string1&strings=string2',
    ),
    'http://foo.com/',
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
    replacePathInUrl(() => '/bar')('https://foo.com/foo?example'),
    'https://foo.com/bar',
);
assert.strictEqual(replacePathInUrl(() => null)('https://foo.com/foo?example'), 'https://foo.com');

assert.strictEqual(
    replacePathnameInUrl(() => '/bar')('https://foo.com/foo'),
    'https://foo.com/bar',
);
assert.strictEqual(replacePathnameInUrl(() => null)('https://foo.com/foo'), 'https://foo.com');
assert.strictEqual(
    replacePathnameInUrl(() => '/bar')('https://foo.com/foo?example'),
    'https://foo.com/bar?example',
);

assert.strictEqual(appendPathnameToUrl('/bar')('/foo'), '/foo/bar');
assert.strictEqual(appendPathnameToUrl('/bar')('/foo/'), '/foo/bar');
assert.strictEqual(appendPathnameToUrl('/bar')('/foo?example'), '/foo/bar?example');
assert.strictEqual(appendPathnameToUrl('/bar')('/@foo'), '/@foo/bar');

assert.strictEqual(replaceHashInUrl(() => '#bar')('/foo'), '/foo#bar');
assert.strictEqual(replaceHashInUrl(() => null)('/foo#bar'), '/foo');
assert.strictEqual(replaceHashInUrl(() => '#baz')('/foo#bar'), '/foo#baz');
