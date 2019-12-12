import { fold, map, tryCatch } from 'fp-ts/lib/Either';
import * as t from 'io-ts';
import { Lens } from 'monocle-ts';
import { pipe, pipeWith } from 'pipe-ts';
import * as urlHelpers from 'url';
import { URL, URLSearchParams } from 'url';
import { getOrElseMaybe, mapMaybe } from './helpers/maybe';
import { isNonEmptyString } from './helpers/other';

const urlClassT = new t.Type<URL, string, string>(
    'URL',
    (value): value is URL => value instanceof URL,
    (string, context) =>
        pipeWith(
            tryCatch(() => new URL(string), error => error),
            fold(() => t.failure(string, context), t.success),
        ),
    urlClass => urlClass.toString(),
);

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

We have to create an immutable intermediate object. That's what `URLObject` is for.
*/

// TODO: omit helper in newer TS
// TODO: consistent casing for "URL"
// We omit some properties since they're just serialized versions of other properties, which only
// make sense for a mutable API.
type URLObject = Pick<
    URL,
    // TODO: whitelist instead of blacklist? like format
    Exclude<keyof URL, 'toJSON' | 'toString' | 'search' | 'href' | 'origin' | 'host'>
>;

// TODO: pick helper
const urlClassToUrlObject = ({
    hash,
    hostname,
    password,
    pathname,
    port,
    protocol,
    searchParams,
    username,
}: URL): URLObject => ({
    hash,
    hostname,
    password,
    pathname,
    port,
    protocol,
    searchParams,
    username,
});

const createAuthForFormat = ({
    username,
    password,
}: Pick<URL, 'username' | 'password'>): string | undefined => {
    if (username !== '') {
        const parts = [username, ...(password === undefined ? [] : [password])];
        return parts.join(':');
    } else {
        return undefined;
    }
};

type FormatInput = Pick<
    urlHelpers.UrlObject,
    'auth' | 'hash' | 'hostname' | 'pathname' | 'port' | 'protocol' | 'search'
>;

const urlObjectToFormatInput = ({
    hash,
    hostname,
    password,
    pathname,
    port,
    protocol,
    searchParams,
    username,
}: URLObject): FormatInput => ({
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
});

const urlObjectToUrlString = pipe(
    urlObjectToFormatInput,
    urlHelpers.format,
);

const urlStringToUrlClass = (s: string): URL => new URL(s);

// Workaround for
// https://github.com/whatwg/url/issues/354
// https://github.com/nodejs/node/pull/28482
// https://github.com/nodejs/node/issues/25099
// https://stackoverflow.com/questions/55867415/create-empty-url-object-from-scratch-in-javascript
const urlObjectToUrlClass = pipe(
    urlObjectToUrlString,
    urlStringToUrlClass,
);

const urlObjectLens = new Lens(urlClassToUrlObject, urlObject => () =>
    urlObjectToUrlClass(urlObject),
);

// TODO
// This is a workaround for binding
const modify = <S, A>(lens: Lens<S, A>) => lens.modify.bind(lens);

export const modifyUrlClass = modify(urlObjectLens);
export const modifyUrl = pipe(
    modifyUrlClass,
    urlClassFn =>
        pipe(
            urlClassT.decode,
            map(urlClassFn),
            map(urlClassT.encode),
        ),
);

export const replaceSearchParamsInURLObject = modify(Lens.fromProp<URLObject>()('searchParams'));
export const replaceSearchParamsInUrl = pipe(
    replaceSearchParamsInURLObject,
    modifyUrl,
);

export const addSearchParamsToURLObject = (searchParamsToAdd: URLSearchParams) =>
    replaceSearchParamsInURLObject(
        prev => new URLSearchParams([...prev.entries(), ...searchParamsToAdd.entries()]),
    );
export const addSearchParamsInUrl = pipe(
    addSearchParamsToURLObject,
    modifyUrl,
);

type PathObject = Pick<URLObject, 'pathname' | 'searchParams'>;
const pathObjectLens = Lens.fromProps<URLObject>()(['pathname', 'searchParams']);

const pathObjectToString = ({ pathname, searchParams }: PathObject): string =>
    `${pathname}${searchParams.toString()}`;
const pathStringToObject = (s: string): PathObject => {
    // TODO: assert
    const [, pathname, search] = s.match(/(.*)\??(.*)/)!;
    return { pathname, searchParams: new URLSearchParams(search) };
};
const pathLens = pathObjectLens.compose(
    new Lens(pathObjectToString, s => () => pathStringToObject(s)),
);

export const replacePathInURLObject = modify(pathLens);
export const replacePathInUrl = pipe(
    replacePathInURLObject,
    modifyUrl,
);

export const replacePathnameInURLObject = modify(Lens.fromProp<URLObject>()('pathname'));
export const replacePathnameInUrl = pipe(
    replacePathnameInURLObject,
    modifyUrl,
);

const getPathnameFromParts = (parts: string[]) => `/${parts.join('/')}`;
const getPartsFromPathname = (pathname: string) => pathname.split('/').filter(isNonEmptyString);

export const appendPathnameToURLObject = (pathnameToAppend: string) =>
    replacePathnameInURLObject(prevPathname => {
        const pathnameParts = pipeWith(mapMaybe(prevPathname, getPartsFromPathname), maybe =>
            getOrElseMaybe(maybe, () => []),
        );
        const pathnamePartsToAppend = getPartsFromPathname(pathnameToAppend);
        const newPathnameParts = [...pathnameParts, ...pathnamePartsToAppend];
        const newPathname = getPathnameFromParts(newPathnameParts);
        return newPathname;
    });
export const appendPathnameToUrl = pipe(
    appendPathnameToURLObject,
    modifyUrl,
);

export const replaceHashInURLObject = modify(Lens.fromProp<URLObject>()('hash'));
export const replaceHashInUrl = pipe(
    replaceHashInURLObject,
    modifyUrl,
);
