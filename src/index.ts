import { pipe, pipeWith } from 'pipe-ts';
import * as urlHelpers from 'url';
import { URL, URLSearchParams } from 'url';
import { getOrElseMaybe, mapMaybe } from './helpers/maybe';
import { isNonEmptyString } from './helpers/other';

type Update<T> = T | ((prev: T) => T);

const getPathnameFromParts = (parts: string[]) => `/${parts.join('/')}`;

const getPartsFromPathname = (pathname: string) => pathname.split('/').filter(isNonEmptyString);

/*
We can't create copies of a `URL`:

```ts
(Object.assign({}, new URL('https://foo.bar/'), {pathname: '/foo'})).toString()
// => '[object Object]'
```

This is because `URL` is designed to be operated on via mutations:

```ts
(Object.assign(new URL('https://foo.bar/'), {pathname: '/foo'})).toString()
// => 'https://foo.bar/foo'
```

But we want to operate on it immutably.

Given this, how can we parse/decode a URL, modify it immutably, and then
serialize/format/stringify/encode it again?

We have to create an immutable intermediate object. That's what `UrlObject` is for.
*/
// We omit some properties since they're just serialized versions of other properties.
type UrlObject = Required<
    Pick<
        URL,
        | 'hash'
        | 'hostname'
        | 'password'
        | 'pathname'
        | 'port'
        | 'protocol'
        | 'searchParams'
        | 'username'
    >
>;
// TODO: pick helper
const urlClassToObject = ({
    hash,
    hostname,
    password,
    pathname,
    port,
    protocol,
    searchParams,
    username,
}: URL): UrlObject => ({
    hash,
    hostname,
    password,
    pathname,
    port,
    protocol,
    searchParams,
    username,
});

type MapUrlObjectFn = (urlObject: UrlObject) => UrlObject;
export const mapUrlClass = (fn: MapUrlObjectFn) =>
    pipe(
        urlClassToObject,
        fn,
        urlObjectToClass,
    );

export const mapUrlObject = (fn: MapUrlObjectFn): MapUrlObjectFn => urlObject => fn(urlObject);

const urlStringToClass = (urlString: string) => new URL(urlString);

export const createAuthForFormat = ({
    username,
    password,
}: Pick<URL, 'username' | 'password'>): string | undefined => {
    if (username !== '') {
        const parts = [username, ...(password === '' ? [] : [password])];
        return parts.join(':');
    } else {
        return undefined;
    }
};

// Workaround for
// https://github.com/whatwg/url/issues/354
// https://github.com/nodejs/node/pull/28482
// https://github.com/nodejs/node/issues/25099
// https://stackoverflow.com/questions/55867415/create-empty-url-object-from-scratch-in-javascript
const urlObjectToClass = pipe(
    ({
        hash,
        hostname,
        password,
        pathname,
        port,
        protocol,
        searchParams,
        username,
    }: UrlObject): string =>
        urlHelpers.format({
            auth: createAuthForFormat({ username, password }),
            hash,
            hostname,
            pathname,
            port,
            protocol,
            search: searchParams.toString(),
            // TODO: ?
            // https://devdocs.io/node/url#url_urlobject_slashes
            // slashes: true
        }),

    urlStringToClass,
);

const urlObjectToString = pipe(
    urlObjectToClass,
    url => url.toString(),
);

const urlStringToObject = pipe(
    urlStringToClass,
    urlClassToObject,
);

type MapUrlFn = (url: string) => string;
export const mapUrl = (fn: MapUrlObjectFn): MapUrlFn =>
    pipe(
        urlStringToObject,
        fn,
        urlObjectToString,
    );

export const replaceSearchParamsInUrlObject = (
    newSearchParams: Update<UrlObject['searchParams']>,
): MapUrlObjectFn => urlObject => ({
    ...urlObject,
    searchParams:
        newSearchParams instanceof Function
            ? newSearchParams(urlObject.searchParams)
            : newSearchParams,
});

export const replaceSearchParamsInUrl = pipe(
    replaceSearchParamsInUrlObject,
    mapUrl,
);

export const addSearchParamsToUrlObject = (
    searchParamsToAppend: UrlObject['searchParams'],
): MapUrlObjectFn =>
    replaceSearchParamsInUrlObject(
        existingSearchParams =>
            new URLSearchParams([
                ...existingSearchParams.entries(),
                ...searchParamsToAppend.entries(),
            ]),
    );

export const addSearchParamsToUrl = pipe(
    addSearchParamsToUrlObject,
    mapUrl,
);

type PathObject = Pick<UrlObject, 'searchParams' | 'pathname'>;

// TODO: workaround for https://github.com/nodejs/node/issues/12682
const DUMMY_BASE_URL = 'https://foo.bar';
export const pathStringToObject = pipe(
    (pathString: string) => new URL(pathString, DUMMY_BASE_URL),
    ({ searchParams, pathname }): PathObject => ({
        searchParams: new URLSearchParams([...searchParams.entries()]),
        pathname,
    }),
);

export const replacePathInUrlObject = (newPath: Update<string>): MapUrlObjectFn => urlObject =>
    pipeWith(
        newPath instanceof Function ? newPath(urlObject.pathname) : newPath,
        pathStringToObject,
        newPathObject => ({ ...urlObject, ...newPathObject }),
    );

export const replacePathInUrl = pipe(
    replacePathInUrlObject,
    mapUrl,
);

export const replacePathnameInUrlObject = (
    newPathname: Update<UrlObject['pathname']>,
): MapUrlObjectFn => urlObject => ({
    ...urlObject,
    pathname: newPathname instanceof Function ? newPathname(urlObject.pathname) : newPathname,
});

export const replacePathnameInUrl = pipe(
    replacePathnameInUrlObject,
    mapUrl,
);

export const appendPathnameToUrlObject = (pathnameToAppend: string): MapUrlObjectFn =>
    replacePathnameInUrlObject(prevPathname => {
        const pathnameParts = pipeWith(mapMaybe(prevPathname, getPartsFromPathname), maybe =>
            getOrElseMaybe(maybe, () => []),
        );
        const pathnamePartsToAppend = getPartsFromPathname(pathnameToAppend);
        const newPathnameParts = [...pathnameParts, ...pathnamePartsToAppend];
        const newPathname = getPathnameFromParts(newPathnameParts);
        return newPathname;
    });

export const appendPathnameToUrl = pipe(
    appendPathnameToUrlObject,
    mapUrl,
);

export const replaceHashInUrlObject = (
    newHash: Update<UrlObject['hash']>,
): MapUrlObjectFn => urlObject => ({
    ...urlObject,
    hash: newHash instanceof Function ? newHash(urlObject.hash) : newHash,
});

export const replaceHashInUrl = pipe(
    replaceHashInUrlObject,
    mapUrl,
);
