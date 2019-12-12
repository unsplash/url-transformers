import * as assert from 'assert';
import { URL, URLSearchParams } from 'url';
import { createAuthForFormat, modifyUrlClass, pathStringToObject } from '../index';

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
assert.deepEqual(
    modifyUrlClass(urlObject => ({
        ...urlObject,
        pathname: '/foo',
        searchParams: new URLSearchParams({ a: 'b' }),
    }))(new URL('https://foo.com/bar')).toString(),
    'https://foo.com/foo?a=b',
);

assert.deepEqual(pathStringToObject('?a=b'), {
    pathname: '',
    searchParams: new URLSearchParams({ a: 'b' }),
});
