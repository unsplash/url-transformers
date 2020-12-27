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
interface ParsedUrl
    extends Required<
        Pick<
            NodeUrlObjectWithParsedQuery,
            'auth' | 'hash' | 'hostname' | 'pathname' | 'port' | 'protocol' | 'query' | 'slashes'
        >
    > {}

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

const parseUrl = pipe(parseUrlWithQueryString, convertNodeUrl);
const formatUrl = (parsedUrl: ParsedUrl) => urlHelpers.format(parsedUrl);

type Codec<O, I> = {
    decode: (i: I) => O;
    encode: (o: O) => I;
};

const urlCodec: Codec<ParsedUrl, string> = {
    decode: parseUrl,
    encode: formatUrl,
};

type MapParsedUrlFn = (parsedUrl: ParsedUrl) => ParsedUrl;
export const mapParsedUrl = (fn: MapParsedUrlFn): MapParsedUrlFn => fn;

type MapUrlFn = (url: string) => string;
export const mapUrl = (fn: MapParsedUrlFn): MapUrlFn => pipe(urlCodec.decode, fn, urlCodec.encode);

export const replaceQueryInParsedUrl = (newQuery: Update<ParsedUrl['query']>): MapParsedUrlFn => (
    parsedUrl,
) => ({
    ...parsedUrl,
    query: typeof newQuery === 'function' ? newQuery(parsedUrl.query) : newQuery,
});

export const replaceQueryInUrl = pipe(replaceQueryInParsedUrl, mapUrl);

export const addQueryToParsedUrl = (queryToAppend: ParsedUrl['query']): MapParsedUrlFn =>
    replaceQueryInParsedUrl((prevQuery) => ({ ...prevQuery, ...queryToAppend }));

export const addQueryToUrl = pipe(addQueryToParsedUrl, mapUrl);

interface ParsedPath extends Pick<ParsedUrl, 'query' | 'pathname'> {}

const parsePath = pipe(
    parseUrlWithQueryString,
    ({ query, pathname }): ParsedPath => ({ query, pathname }),
);

const parseNullablePath = pipe(
    mapMaybe(parsePath),
    getOrElseMaybe((): ParsedPath => ({ query: null, pathname: null })),
);

const formatPath = (parsedPath: ParsedPath) => urlHelpers.format(parsedPath);

type Path = urlHelpers.Url['path'];

const pathCodec: Codec<ParsedPath, Path> = {
    decode: parseNullablePath,
    encode: formatPath,
};

const convertUpdatePathFnToUpdateParsedPathFn = (
    updatePath: UpdateFn<Path>,
): UpdateFn<ParsedPath> => pipe(pathCodec.encode, updatePath, pathCodec.decode);

const convertUpdatePathToUpdateParsedPath = (newPath: Update<Path>): Update<ParsedPath> =>
    typeof newPath === 'function'
        ? convertUpdatePathFnToUpdateParsedPathFn(newPath)
        : parseNullablePath(newPath);

export const replacePathInParsedUrl = (newPath: Update<ParsedPath>): MapParsedUrlFn => (
    parsedUrl,
) => ({
    ...parsedUrl,
    ...(typeof newPath === 'function' ? newPath(parsedUrl) : newPath),
});

export const replacePathInUrl = pipe(
    convertUpdatePathToUpdateParsedPath,
    replacePathInParsedUrl,
    mapUrl,
);

export const replacePathnameInParsedUrl = (
    newPathname: Update<ParsedUrl['pathname']>,
): MapParsedUrlFn => (parsedUrl) => ({
    ...parsedUrl,
    pathname: typeof newPathname === 'function' ? newPathname(parsedUrl.pathname) : newPathname,
});

export const replacePathnameInUrl = pipe(replacePathnameInParsedUrl, mapUrl);

export const appendPathnameToParsedUrl = (pathnameToAppend: string): MapParsedUrlFn =>
    replacePathnameInParsedUrl((prevPathname) => {
        const pathnameParts = pipeWith(
            prevPathname,
            mapMaybe(getPartsFromPathname),
            getOrElseMaybe((): string[] => []),
        );
        const pathnamePartsToAppend = getPartsFromPathname(pathnameToAppend);
        const newPathnameParts = [...pathnameParts, ...pathnamePartsToAppend];
        const newPathname = getPathnameFromParts(newPathnameParts);
        return newPathname;
    });

export const appendPathnameToUrl = pipe(appendPathnameToParsedUrl, mapUrl);

export const replaceHashInParsedUrl = (newHash: Update<ParsedUrl['hash']>): MapParsedUrlFn => (
    parsedUrl,
) => ({
    ...parsedUrl,
    hash: typeof newHash === 'function' ? newHash(parsedUrl.hash) : newHash,
});

export const replaceHashInUrl = pipe(replaceHashInParsedUrl, mapUrl);
