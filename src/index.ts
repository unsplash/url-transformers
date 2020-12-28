import { flow, pipe } from 'fp-ts/lib/function';
import * as L from 'monocle-ts/lib/Lens';
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

export const urlLens = L.id<ParsedUrl>();

const lensModifyOrSet = <S, A>(sa: L.Lens<S, A>) => (f: A | ((a: A) => A)) =>
    // TODO: typeof f === 'function' - errors
    f instanceof Function ? pipe(sa, L.modify(f)) : sa.set(f);

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

const parseUrl = flow(parseUrlWithQueryString, convertNodeUrl);
const formatUrl = (parsedUrl: ParsedUrl) => urlHelpers.format(parsedUrl);

type Codec<A, IO> = {
    decode: (io: IO) => A;
    encode: (a: A) => IO;
};

const urlCodec: Codec<ParsedUrl, string> = {
    decode: parseUrl,
    encode: formatUrl,
};

type MapParsedUrlFn = (parsedUrl: ParsedUrl) => ParsedUrl;
export const mapParsedUrl = (fn: MapParsedUrlFn): MapParsedUrlFn => fn;

type MapUrlFn = (url: string) => string;
export const mapUrl = (fn: MapParsedUrlFn): MapUrlFn => flow(urlCodec.decode, fn, urlCodec.encode);

export const queryLens: L.Lens<ParsedUrl, ParsedUrl['query']> = pipe(urlLens, L.prop('query'));

export const replaceQueryInParsedUrl = pipe(queryLens, lensModifyOrSet);

export const replaceQueryInUrl = flow(replaceQueryInParsedUrl, mapUrl);

export const addQueryToParsedUrl = (queryToAppend: ParsedUrl['query']): MapParsedUrlFn =>
    replaceQueryInParsedUrl((prevQuery) => ({ ...prevQuery, ...queryToAppend }));

export const addQueryToUrl = flow(addQueryToParsedUrl, mapUrl);

interface ParsedPath extends Pick<ParsedUrl, 'query' | 'pathname'> {}

export const pathLens: L.Lens<ParsedUrl, ParsedPath> = pipe(urlLens, L.props('pathname', 'query'));

const parsePath = flow(parseUrlWithQueryString, pathLens.get);

const parseNullablePath = flow(
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
): UpdateFn<ParsedPath> => flow(pathCodec.encode, updatePath, pathCodec.decode);

const convertUpdatePathToUpdateParsedPath = (newPath: Update<Path>): Update<ParsedPath> =>
    typeof newPath === 'function'
        ? convertUpdatePathFnToUpdateParsedPathFn(newPath)
        : parseNullablePath(newPath);

export const replacePathInParsedUrl = pipe(pathLens, lensModifyOrSet);

export const replacePathInUrl = flow(
    convertUpdatePathToUpdateParsedPath,
    replacePathInParsedUrl,
    mapUrl,
);

export const pathnameLens: L.Lens<ParsedUrl, ParsedUrl['pathname']> = pipe(
    urlLens,
    L.prop('pathname'),
);

export const replacePathnameInParsedUrl = pipe(pathnameLens, lensModifyOrSet);

export const replacePathnameInUrl = flow(replacePathnameInParsedUrl, mapUrl);

export const appendPathnameToParsedUrl = (pathnameToAppend: string): MapParsedUrlFn =>
    replacePathnameInParsedUrl((prevPathname) => {
        const pathnameParts = pipe(
            prevPathname,
            mapMaybe(getPartsFromPathname),
            getOrElseMaybe((): string[] => []),
        );
        const pathnamePartsToAppend = getPartsFromPathname(pathnameToAppend);
        const newPathnameParts = [...pathnameParts, ...pathnamePartsToAppend];
        const newPathname = getPathnameFromParts(newPathnameParts);
        return newPathname;
    });

export const appendPathnameToUrl = flow(appendPathnameToParsedUrl, mapUrl);

export const hashLens: L.Lens<ParsedUrl, ParsedUrl['hash']> = pipe(urlLens, L.prop('hash'));

export const replaceHashInParsedUrl = pipe(hashLens, lensModifyOrSet);

export const replaceHashInUrl = flow(replaceHashInParsedUrl, mapUrl);
