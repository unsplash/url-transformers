import * as urlHelpers from 'url';
import { UrlObject, UrlWithParsedQuery, UrlWithStringQuery } from 'url';
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

// Note: if/when this PR is merged, this type will be available via the Node types.
// https://github.com/DefinitelyTyped/DefinitelyTyped/pull/33997
type ParsedUrlQueryInput = { [key: string]: unknown };
const addQueryToParsedUrl = ({
    queryToAppend,
}: {
    queryToAppend: ParsedUrlQueryInput;
}): MapUrlWithParsedQueryFn => ({ parsedUrl }) => {
    const { auth, protocol, host, hash, pathname, query: existingQuery } = parsedUrl;
    const newQuery = { ...existingQuery, ...queryToAppend };
    return {
        auth,
        protocol,
        host,
        hash,
        pathname,
        query: newQuery,
    };
};

export const addQueryToUrl = flipCurried(
    pipe(
        addQueryToParsedUrl,
        mapUrlWithParsedQuery,
    ),
);

const replaceQueryInParsedUrl = ({
    newQuery,
}: {
    newQuery: ParsedUrlQueryInput;
}): MapUrlWithParsedQueryFn => ({ parsedUrl }) => {
    const { auth, protocol, host, hash, pathname } = parsedUrl;
    return {
        auth,
        protocol,
        host,
        hash,
        pathname,
        query: newQuery,
    };
};

export const replaceQueryInUrl = flipCurried(
    pipe(
        replaceQueryInParsedUrl,
        mapUrlWithParsedQuery,
    ),
);

const parsePath = pipe(
    urlHelpers.parse,
    ({ search, pathname }) => ({ search, pathname }),
);

const replacePathInParsedUrl = ({ newPath }: { newPath: string }): MapUrlFn => ({ parsedUrl }) =>
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

const replacePathnameInParsedUrl = ({ newPathname }: { newPathname: string }): MapUrlFn => ({
    parsedUrl,
}) => ({ ...parsedUrl, pathname: newPathname });

export const replacePathnameInUrl = flipCurried(
    pipe(
        replacePathnameInParsedUrl,
        mapUrl,
    ),
);

const appendPathnameToParsedUrl = ({
    pathnameToAppend,
}: {
    pathnameToAppend: string;
}): MapUrlFn => ({ parsedUrl }) => {
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

const replaceHashInParsedUrl = ({ newHash }: { newHash: string | undefined }): MapUrlFn => ({
    parsedUrl,
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
