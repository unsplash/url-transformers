import { ParsedUrlQuery } from 'querystring';
import * as urlHelpers from 'url';
import { UrlWithParsedQuery, UrlWithStringQuery } from 'url';
import { getOrElseMaybe, mapMaybe } from './helpers/maybe';
import { flipCurried, isNonEmptyString } from './helpers/other';
import { pipe } from './helpers/pipe';

const getPathnameFromParts = (parts: string[]) => `/${parts.join('/')}`;

const getPartsFromPathname = (pathname: string) => pathname.split('/').filter(isNonEmptyString);

const parseUrlWithQueryString = (url: string) =>
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
    )({});

export const replacePathInUrl = flipCurried(
    pipe(
        replacePathInParsedUrl,
        mapUrl,
    ),
);

const replacePathnameInParsedUrl = ({ newPathname }: { newPathname: string }) => ({
    parsedUrl,
}: {
    parsedUrl: UrlWithStringQuery;
}) => ({ ...parsedUrl, pathname: newPathname });

export const replacePathnameInUrl = flipCurried(
    pipe(
        replacePathnameInParsedUrl,
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
    )({});
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
