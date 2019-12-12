import * as assert from 'assert';
import { right } from 'fp-ts/lib/Either';
import { pipe } from 'pipe-ts';
import { URL, URLSearchParams } from 'url';
import {
    addSearchParamsInUrl,
    appendPathnameToUrl,
    createAuthForFormat,
    modifyUrl,
    modifyUrlClass,
    pathStringToObject,
    replaceHashInUrl,
    replacePathInUrl,
    replacePathnameInUrl,
    replacePathnameInURLObject,
    replaceSearchParamsInUrl,
    replaceSearchParamsInURLObject,
} from '../index';
import './helpers';

assert.deepEqual(createAuthForFormat({ username: '', password: '' }), undefined);
assert.deepEqual(createAuthForFormat({ username: 'a', password: '' }), 'a');
assert.deepEqual(createAuthForFormat({ username: 'a', password: 'b' }), 'a:b');

assert.deepEqual(pathStringToObject(''), { pathname: '', searchParams: new URLSearchParams() });
assert.deepEqual(pathStringToObject('/foo'), {
    pathname: '/foo',
    searchParams: new URLSearchParams(),
});
assert.deepEqual(pathStringToObject('/foo?a=b'), {
    pathname: '/foo',
    searchParams: new URLSearchParams({ a: 'b' }),
});
assert.deepEqual(pathStringToObject('?a=b'), {
    pathname: '',
    searchParams: new URLSearchParams({ a: 'b' }),
});

assert.deepEqual(
    modifyUrlClass(urlObject => ({
        ...urlObject,
        pathname: '/foo',
        searchParams: new URLSearchParams({ a: 'b' }),
    }))(new URL('https://foo.com/bar')).toString(),
    'https://foo.com/foo?a=b',
);

assert.deepEqual(
    modifyUrl(urlObject => ({
        ...urlObject,
        pathname: '/foo',
        searchParams: new URLSearchParams({ a: 'b' }),
    }))('https://foo.com/bar'),
    right('https://foo.com/foo?a=b'),
);

assert.deepEqual(
    modifyUrl(
        pipe(
            replacePathnameInURLObject(() => '/foo'),
            replaceSearchParamsInURLObject(() => new URLSearchParams({ a: 'b' })),
        ),
    )('https://foo.com/bar'),
    right('https://foo.com/foo?a=b'),
);

assert.strictEqual(replaceSearchParamsInUrl(() => new URLSearchParams({}))('INVALID')._tag, 'Left');
assert.deepEqual(
    replaceSearchParamsInUrl(() => new URLSearchParams({ foo: '1' }))(
        'http://foo.com/?string=string',
    ),
    right('http://foo.com/?foo=1'),
);
assert.deepEqual(
    replaceSearchParamsInUrl(() => new URLSearchParams())('http://foo.com/?string=string'),
    right('http://foo.com/'),
);

assert.deepEqual(
    addSearchParamsInUrl(new URLSearchParams({ string: 'string' }))('http://foo.com/'),
    right('http://foo.com/?string=string'),
);
assert.deepEqual(
    addSearchParamsInUrl(new URLSearchParams({ a: 'b' }))('http://foo:bar@baz.com/'),
    right('http://foo:bar@baz.com/?a=b'),
);
assert.deepEqual(
    addSearchParamsInUrl(new URLSearchParams({ c: 'd' }))('http://foo.com/?a=b&b=c'),
    right('http://foo.com/?a=b&b=c&c=d'),
);

assert.deepEqual(
    replacePathInUrl(() => '/bar')('https://foo.com/foo?example'),
    right('https://foo.com/bar'),
);
assert.deepEqual(
    replacePathInUrl(() => '')('https://foo.com/foo?example'),
    right('https://foo.com/'),
);
// TODO: or null?
// assert.deepEqual(replacePathInUrl(() => null)('https://foo.com/foo?example'), right('https://foo.com/'));

assert.deepEqual(
    replacePathnameInUrl(() => '/bar')('https://foo.com/foo'),
    right('https://foo.com/bar'),
);
// TODO: or null?
// assert.deepEqual(replacePathnameInUrl(() => null)('https://foo.com/foo'), right('https://foo.com'));
assert.deepEqual(replacePathnameInUrl(() => '')('https://foo.com/foo'), right('https://foo.com/'));
assert.deepEqual(
    replacePathnameInUrl(() => '/bar')('https://foo.com/foo?example='),
    right('https://foo.com/bar?example='),
);

// TODO: test these independently? how?
// An `/` is appended due to the behaviour of `pathname`:
// new URL('http://foo.bar').pathname // => '/'
// new URL('http://foo.bar').toString() // => 'http://foo.bar/'
// An `=` is appended due to the behaviour of `searchParams.toString`:
// new URL('http://foo.bar/?a').searchParams.toString() // => 'a='

assert.deepEqual(
    appendPathnameToUrl('/bar')('https://foo.com/foo'),
    right('https://foo.com/foo/bar'),
);
assert.deepEqual(
    appendPathnameToUrl('/bar')('https://foo.com/foo/'),
    right('https://foo.com/foo/bar'),
);
assert.deepEqual(
    appendPathnameToUrl('/bar')('https://foo.com/foo?example='),
    right('https://foo.com/foo/bar?example='),
);
assert.deepEqual(
    appendPathnameToUrl('/bar')('https://foo.com/@foo'),
    right('https://foo.com/@foo/bar'),
);

assert.deepEqual(
    replaceHashInUrl(() => '#bar')('https://foo.com/foo'),
    right('https://foo.com/foo#bar'),
);
// TODO: or null?
// assert.deepEqual(replaceHashInUrl(() => null)('https://foo.com/foo#bar'), right('https://foo.com/foo'));
assert.deepEqual(
    replaceHashInUrl(() => '')('https://foo.com/foo#bar'),
    right('https://foo.com/foo'),
);
assert.deepEqual(
    replaceHashInUrl(() => '#baz')('https://foo.com/foo#bar'),
    right('https://foo.com/foo#baz'),
);
