import * as assert from 'assert';
import { pipe, pipeWith } from 'pipe-ts';
import { URL, URLSearchParams } from 'url';
import {
    addSearchParamsToUrl,
    createAuthForFormat,
    mapUrl,
    mapUrlClass,
    pathStringToObject,
    replacePathInUrl,
    replacePathnameInUrl,
    replacePathnameInUrlObject,
    replaceSearchParamsInUrl,
    replaceSearchParamsInUrlObject,
} from './index';

assert.deepEqual(
    pipeWith(
        new URL('https://foo.com/bar'),
        mapUrlClass(urlObject => ({
            ...urlObject,
            pathname: '/foo',
            searchParams: new URLSearchParams({ a: 'b' }),
        })),
        url => url.toString(),
    ),
    'https://foo.com/foo?a=b',
);

assert.deepEqual(
    pipeWith(
        'https://foo.com/bar',
        mapUrl(urlObject => ({
            ...urlObject,
            pathname: '/foo',
            searchParams: new URLSearchParams({ a: 'b' }),
        })),
    ),
    'https://foo.com/foo?a=b',
);

assert.deepEqual(
    pipeWith(
        'https://foo.com/bar',
        mapUrl(
            pipe(
                replacePathnameInUrlObject(() => '/foo'),
                replaceSearchParamsInUrlObject(() => new URLSearchParams({ a: 'b' })),
            ),
        ),
    ),
    'https://foo.com/foo?a=b',
);

// TODO: allow relative https://github.com/nodejs/node/issues/12682
// assert.strictEqual(
//     replaceSearchParamsInUrl(new URLSearchParams({ foo: '1' }))(
//         '/foo?string=string&number=1&boolean=true&strings=string1&strings=string2',
//     ),
//     '/foo?foo=1',
// );

assert.strictEqual(
    replaceSearchParamsInUrl(new URLSearchParams({ foo: '1' }))(
        'http://foo.com/?string=string&number=1&boolean=true&strings=string1&strings=string2',
    ),
    'http://foo.com/?foo=1',
);
assert.strictEqual(
    replaceSearchParamsInUrl(new URLSearchParams({}))(
        'http://foo.com/?string=string&number=1&boolean=true&strings=string1&strings=string2',
    ),
    'http://foo.com/',
);

assert.strictEqual(
    addSearchParamsToUrl(
        new URLSearchParams({
            string: 'string',
            strings: ['string1', 'string2'],
        }),
    )('http://foo.com/'),
    'http://foo.com/?string=string&strings=string1%2Cstring2',
);
assert.strictEqual(
    addSearchParamsToUrl(new URLSearchParams({ a: 'b' }))('http://foo:bar@baz.com/'),
    'http://foo:bar@baz.com/?a=b',
);
assert.strictEqual(
    addSearchParamsToUrl(new URLSearchParams({ c: 'd' }))('http://foo.com/?a=b&b=c'),
    'http://foo.com/?a=b&b=c&c=d',
);

assert.strictEqual(replacePathInUrl('/bar')('https://foo.com/foo?example'), 'https://foo.com/bar');
assert.strictEqual(replacePathInUrl('')('https://foo.com/foo?example'), 'https://foo.com/');

assert.strictEqual(replacePathnameInUrl('/bar')('https://foo.com/foo'), 'https://foo.com/bar');
assert.strictEqual(replacePathnameInUrl('')('https://foo.com/foo'), 'https://foo.com/');
assert.strictEqual(
    replacePathnameInUrl('/bar')('https://foo.com/foo?example='),
    'https://foo.com/bar?example=',
);

// TODO: allow relative https://github.com/nodejs/node/issues/12682
// assert.strictEqual(appendPathnameToUrl('/bar')('/foo'), '/foo/bar');
// assert.strictEqual(appendPathnameToUrl('/bar')('/foo/'), '/foo/bar');
// assert.strictEqual(appendPathnameToUrl('/bar')('/foo?example='), '/foo/bar?example=');
// assert.strictEqual(appendPathnameToUrl('/bar')('/@foo'), '/@foo/bar');

// assert.strictEqual(replaceHashInUrl('#bar')('/foo'), '/foo#bar');
// assert.strictEqual(replaceHashInUrl('')('/foo#bar'), '/foo');
// assert.strictEqual(replaceHashInUrl('#baz')('/foo#bar'), '/foo#baz');

assert.deepEqual(createAuthForFormat({ username: '', password: '' }), undefined);
assert.deepEqual(createAuthForFormat({ username: 'a', password: '' }), 'a');
assert.deepEqual(createAuthForFormat({ username: 'a', password: 'b' }), 'a:b');

assert.deepEqual(pathStringToObject('/'), { pathname: '/', searchParams: new URLSearchParams() });
assert.deepEqual(pathStringToObject(''), { pathname: '/', searchParams: new URLSearchParams() });
assert.deepEqual(pathStringToObject('/foo'), {
    pathname: '/foo',
    searchParams: new URLSearchParams(),
});
assert.deepEqual(pathStringToObject('/foo?a=b'), {
    pathname: '/foo',
    searchParams: new URLSearchParams({ a: 'b' }),
});
assert.deepEqual(pathStringToObject('?a=b'), {
    pathname: '/',
    searchParams: new URLSearchParams({ a: 'b' }),
});
