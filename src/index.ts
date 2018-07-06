import * as urlHelpers from 'url';
import { UrlWithParsedQuery, UrlWithStringQuery } from 'url';
import { mapMaybe, getOrElseMaybe } from './helpers/maybe';
import { isNonEmptyString, flipCurried } from './helpers/other';
import pipe = require('lodash/flow');
import { ParsedUrlQuery } from 'querystring';

const getPathnameFromParts = (parts: string[]) => `/${parts.map(encodeURIComponent).join('/')}`;

const getPartsFromPathname = (pathname: string) =>
    pathname
        .split('/')
        .filter(isNonEmptyString)
        .map(decodeURIComponent);

const parseUrlWithQueryString = (url: string): UrlWithParsedQuery =>
    urlHelpers.parse(
        url,
        // Parse the query string
        true,
    );

const mapUrl = (fn: ({ parsedUrl }: { parsedUrl: UrlWithStringQuery }) => UrlWithStringQuery) =>
    pipe(
        ({ url }: { url: string }) => urlHelpers.parse(url),
        parsedUrl => fn({ parsedUrl }),
        urlHelpers.format,
    );

const mapUrlWithParsedQuery = (
    fn: ({ parsedUrl }: { parsedUrl: UrlWithParsedQuery }) => UrlWithParsedQuery,
) =>
    pipe(
        ({ url }: { url: string }) => parseUrlWithQueryString(url),
        parsedUrl => fn({ parsedUrl }),
        urlHelpers.format,
    );

const addQueryToParsedUrl = ({ queryToAppend }: { queryToAppend: ParsedUrlQuery }) => ({
    parsedUrl,
}: {
    parsedUrl: UrlWithParsedQuery;
}): UrlWithParsedQuery => {
    const { auth, protocol, host, hash, pathname, query: existingQuery } = parsedUrl;
    const newQuery = { ...existingQuery, ...queryToAppend };
    const newParsedUrl = {
        auth,
        protocol,
        host,
        hash,
        pathname,
        query: newQuery,
    };
    return newParsedUrl;
};

export const addQueryToUrl = flipCurried(
    pipe(
        addQueryToParsedUrl,
        mapUrlWithParsedQuery,
    ),
);

const parsePath = pipe(
    urlHelpers.parse,
    ({ search, pathname }) => ({ search, pathname }),
);

const replacePathInParsedUrl = ({ newPath }: { newPath: string }) => ({
    parsedUrl,
}: {
    parsedUrl: UrlWithStringQuery;
}) =>
    pipe(
        () => parsePath(newPath),
        newPathParsed => ({ ...parsedUrl, ...newPathParsed }),
    )();

export const replacePathInUrl = flipCurried(
    pipe(
        replacePathInParsedUrl,
        mapUrl,
    ),
);

const appendPathnameToParsedUrl = ({ pathnameToAppend }: { pathnameToAppend: string }) => ({
    parsedUrl,
}: {
    parsedUrl: UrlWithStringQuery;
}) => {
    const pathnameParts = pipe(
        () => mapMaybe(parsedUrl.pathname, getPartsFromPathname),
        maybe => getOrElseMaybe(maybe, () => []),
    )();
    const pathnamePartsToAppend = getPartsFromPathname(pathnameToAppend);
    const newPathnameParts = [...pathnameParts, ...pathnamePartsToAppend];
    const newPathname = getPathnameFromParts(newPathnameParts);
    return { ...parsedUrl, pathname: newPathname };
};

export const appendPathnameToUrl = flipCurried(
    pipe(
        appendPathnameToParsedUrl,
        mapUrl,
    ),
);

const replaceHashInParsedUrl = ({ newHash }: { newHash: string | undefined }) => ({
    parsedUrl,
}: {
    parsedUrl: UrlWithStringQuery;
}) => ({
    ...parsedUrl,
    hash: newHash,
});

export const replaceHashInUrl = flipCurried(
    pipe(
        replaceHashInParsedUrl,
        mapUrl,
    ),
);
