import { pipe } from 'pipe-ts';
import { ParsedUrlQuery } from 'querystring';
import * as urlHelpers from 'url';
import { UrlObject, UrlWithParsedQuery, UrlWithStringQuery } from 'url';
import { getOrElseMaybe, mapMaybe } from './helpers/maybe';
import { flipCurried, isNonEmptyString } from './helpers/other';

type Update<T> = T | ((prev: T) => T);
type BinaryUpdate<A, B> = B | ((prev: A) => B);

const getPathnameFromParts = (parts: string[]) => `/${parts.join('/')}`;

const getPartsFromPathname = (pathname: string) => pathname.split('/').filter(isNonEmptyString);

const parseUrlWithQueryString = (url: string) =>
    urlHelpers.parse(
        url,
        // Parse the query string
        true,
    );

type MapUrlFn = ({ parsedUrl }: { parsedUrl: UrlWithStringQuery }) => UrlObject;
const mapUrl = (fn: MapUrlFn) =>
    pipe(
        ({ url }: { url: string }) => urlHelpers.parse(url),
        parsedUrl => fn({ parsedUrl }),
        urlHelpers.format,
    );

type MapUrlWithParsedQueryFn = ({ parsedUrl }: { parsedUrl: UrlWithParsedQuery }) => UrlObject;
const mapUrlWithParsedQuery = (fn: MapUrlWithParsedQueryFn) =>
    pipe(
        ({ url }: { url: string }) => parseUrlWithQueryString(url),
        parsedUrl => fn({ parsedUrl }),
        urlHelpers.format,
    );

const replaceQueryInParsedUrl = ({
    newQuery,
}: {
    newQuery: BinaryUpdate<ParsedUrlQuery, ParsedUrlQueryInput>;
}): MapUrlWithParsedQueryFn => ({ parsedUrl }) => {
    const { auth, protocol, host, hash, pathname, query: prevQuery } = parsedUrl;
    return {
        auth,
        protocol,
        host,
        hash,
        pathname,
        query: newQuery instanceof Function ? newQuery(prevQuery) : newQuery,
    };
};

export const replaceQueryInUrl = flipCurried(
    pipe(
        replaceQueryInParsedUrl,
        mapUrlWithParsedQuery,
    ),
);

// Note: if/when this PR is merged, this type will be available via the Node types.
// https://github.com/DefinitelyTyped/DefinitelyTyped/pull/33997
type ParsedUrlQueryInput = { [key: string]: unknown };
const addQueryToParsedUrl = ({
    queryToAppend,
}: {
    queryToAppend: ParsedUrlQueryInput;
}): MapUrlWithParsedQueryFn =>
    replaceQueryInParsedUrl({
        newQuery: existingQuery => ({ ...existingQuery, ...queryToAppend }),
    });

export const addQueryToUrl = flipCurried(
    pipe(
        addQueryToParsedUrl,
        mapUrlWithParsedQuery,
    ),
);

const parsePath = pipe(
    // We must wrap this because otherwise TS might pick the wrong overload
    (url: string) => urlHelpers.parse(url),
    ({ search, pathname }) => ({ search, pathname }),
);

const replacePathInParsedUrl = ({
    newPath,
}: {
    newPath: Update<string | undefined>;
}): MapUrlFn => ({ parsedUrl }) =>
    pipe(
        () =>
            getOrElseMaybe(
                mapMaybe(
                    newPath instanceof Function ? newPath(parsedUrl.pathname) : newPath,
                    parsePath,
                ),
                () => ({
                    search: undefined,
                    pathname: undefined,
                }),
            ),
        newPathParsed => ({ ...parsedUrl, ...newPathParsed }),
    )();

export const replacePathInUrl = flipCurried(
    pipe(
        replacePathInParsedUrl,
        mapUrl,
    ),
);

const replacePathnameInParsedUrl = ({
    newPathname,
}: {
    newPathname: Update<string | undefined>;
}): MapUrlFn => ({ parsedUrl }) => ({
    ...parsedUrl,
    pathname: newPathname instanceof Function ? newPathname(parsedUrl.pathname) : newPathname,
});

export const replacePathnameInUrl = flipCurried(
    pipe(
        replacePathnameInParsedUrl,
        mapUrl,
    ),
);

const appendPathnameToParsedUrl = ({ pathnameToAppend }: { pathnameToAppend: string }): MapUrlFn =>
    replacePathnameInParsedUrl({
        newPathname: prevPathname => {
            const pathnameParts = pipe(
                () => mapMaybe(prevPathname, getPartsFromPathname),
                maybe => getOrElseMaybe(maybe, () => []),
            )();
            const pathnamePartsToAppend = getPartsFromPathname(pathnameToAppend);
            const newPathnameParts = [...pathnameParts, ...pathnamePartsToAppend];
            const newPathname = getPathnameFromParts(newPathnameParts);
            return newPathname;
        },
    });

export const appendPathnameToUrl = flipCurried(
    pipe(
        appendPathnameToParsedUrl,
        mapUrl,
    ),
);

const replaceHashInParsedUrl = ({
    newHash,
}: {
    newHash: Update<string | undefined>;
}): MapUrlFn => ({ parsedUrl }) => ({
    ...parsedUrl,
    hash: newHash instanceof Function ? newHash(parsedUrl.hash) : newHash,
});

export const replaceHashInUrl = flipCurried(
    pipe(
        replaceHashInParsedUrl,
        mapUrl,
    ),
);
