import { pipe, pipeWith } from 'pipe-ts';
import { ParsedUrlQueryInput } from 'querystring';
import * as urlHelpers from 'url';
import { getOrElseMaybe, mapMaybe } from './helpers/maybe';
import { isNonEmptyString } from './helpers/other';

interface NodeUrlObjectWithParsedQuery extends urlHelpers.UrlObject {
    query?: ParsedUrlQueryInput | null;
}

type UpdateFn<T> = (prev: T) => T;
type Update<T> = T | UpdateFn<T>;

const getPathnameFromParts = (parts: string[]) => `/${parts.join('/')}`;

const getPartsFromPathname = (pathname: string) => pathname.split('/').filter(isNonEmptyString);

const parseUrlWithQueryString = (url: string) =>
    urlHelpers.parse(
        url,
        // Parse the query string
        true,
    );

// We omit some properties since they're just serialized versions of other properties.
type ParsedUrl = Required<
    Pick<
        NodeUrlObjectWithParsedQuery,
        'auth' | 'hash' | 'hostname' | 'pathname' | 'port' | 'protocol' | 'query' | 'slashes'
    >
>;

const convertNodeUrl = ({
    auth,
    hash,
    hostname,
    pathname,
    port,
    protocol,
    query,
    slashes,
}: urlHelpers.UrlWithParsedQuery): ParsedUrl => ({
    auth,
    hash,
    hostname,
    pathname,
    port,
    protocol,
    query,
    slashes,
});

type MapParsedUrlFn = (parsedUrl: ParsedUrl) => ParsedUrl;
export const mapParsedUrl = (fn: MapParsedUrlFn): MapParsedUrlFn => parsedUrl => fn(parsedUrl);

type MapUrlFn = (url: string) => string;
export const mapUrl = (fn: MapParsedUrlFn): MapUrlFn =>
    pipe(
        parseUrlWithQueryString,
        convertNodeUrl,
        fn,
        urlHelpers.format,
    );

export const replaceQueryInParsedUrl = (
    newQuery: Update<ParsedUrl['query']>,
): MapParsedUrlFn => parsedUrl => ({
    ...parsedUrl,
    query: newQuery instanceof Function ? newQuery(parsedUrl.query) : newQuery,
});

export const replaceQueryInUrl = pipe(
    replaceQueryInParsedUrl,
    mapUrl,
);

export const addQueryToParsedUrl = (queryToAppend: ParsedUrl['query']): MapParsedUrlFn =>
    replaceQueryInParsedUrl(existingQuery => ({ ...existingQuery, ...queryToAppend }));

export const addQueryToUrl = pipe(
    addQueryToParsedUrl,
    mapUrl,
);

type ParsedPath = Pick<ParsedUrl, 'query' | 'pathname'>;

const parsePath = pipe(
    (path: string) => parseUrlWithQueryString(path),
    ({ query, pathname }): ParsedPath => ({ query, pathname }),
);

const getParsedPathFromString = (maybePath: NodeUrlObjectWithParsedQuery['path']): ParsedPath =>
    pipeWith(
        maybePath,
        maybe => mapMaybe(maybe, parsePath),
        maybe => getOrElseMaybe(maybe, () => ({ query: {}, pathname: null })),
    );

export const replacePathInParsedUrl = (
    newPath: Update<NodeUrlObjectWithParsedQuery['pathname']>,
): MapParsedUrlFn => parsedUrl =>
    pipeWith(
        newPath instanceof Function ? newPath(parsedUrl.pathname) : newPath,
        getParsedPathFromString,
        newPathParsed => ({ ...parsedUrl, ...newPathParsed }),
    );

export const replacePathInUrl = pipe(
    replacePathInParsedUrl,
    mapUrl,
);

export const replacePathnameInParsedUrl = (
    newPathname: Update<ParsedUrl['pathname']>,
): MapParsedUrlFn => parsedUrl => ({
    ...parsedUrl,
    pathname: newPathname instanceof Function ? newPathname(parsedUrl.pathname) : newPathname,
});

export const replacePathnameInUrl = pipe(
    replacePathnameInParsedUrl,
    mapUrl,
);

export const appendPathnameToParsedUrl = (pathnameToAppend: string): MapParsedUrlFn =>
    replacePathnameInParsedUrl(prevPathname => {
        const pathnameParts = pipeWith(mapMaybe(prevPathname, getPartsFromPathname), maybe =>
            getOrElseMaybe(maybe, () => []),
        );
        const pathnamePartsToAppend = getPartsFromPathname(pathnameToAppend);
        const newPathnameParts = [...pathnameParts, ...pathnamePartsToAppend];
        const newPathname = getPathnameFromParts(newPathnameParts);
        return newPathname;
    });

export const appendPathnameToUrl = pipe(
    appendPathnameToParsedUrl,
    mapUrl,
);

export const replaceHashInParsedUrl = (
    newHash: Update<ParsedUrl['hash']>,
): MapParsedUrlFn => parsedUrl => ({
    ...parsedUrl,
    hash: newHash instanceof Function ? newHash(parsedUrl.hash) : newHash,
});

export const replaceHashInUrl = pipe(
    replaceHashInParsedUrl,
    mapUrl,
);
