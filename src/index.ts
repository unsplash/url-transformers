import * as assert from 'assert';
import { Lens } from 'monocle-ts';
import { pipe, pipeWith } from 'pipe-ts';
import * as urlHelpers from 'url';
import { UrlObject, UrlWithParsedQuery, UrlWithStringQuery } from 'url';
import { getOrElseMaybe, mapMaybe } from './helpers/maybe';
import { flipCurried, isNonEmptyString } from './helpers/other';

type Update<T> = ((prev: T) => T);

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

const queryAndSearchLens = Lens.fromProps<UrlWithParsedQuery>()(['search', 'query']);

const queryLens = queryAndSearchLens.compose(
    new Lens(({ query }) => query, query => () => ({ search: undefined, query })),
);

// TODO: not a lawful lens!
const s: Pick<UrlWithParsedQuery, 'search' | 'query'> = { query: { foo: '1' }, search: 'a' };
// 2. set(get(s))(s) = s
assert.deepStrictEqual(queryLens.set(queryLens.get(s))(s), s); // error

const queryInputLens = queryLens.compose(
    new Lens(
        query => query as ParsedUrlQueryInput,
        query => () => query as UrlWithParsedQuery['query'],
    ),
);

const replaceQueryInParsedUrl = ({
    newQuery,
}: {
    newQuery: Update<ParsedUrlQueryInput>;
}): MapUrlWithParsedQueryFn => ({ parsedUrl }) => queryInputLens.modify(newQuery)(parsedUrl);

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

type ParsedPath = Pick<UrlWithStringQuery, 'search' | 'pathname'>;
const pathLens = Lens.fromProps<UrlWithStringQuery>()(['search', 'pathname']);

const parsePath = pipe(
    // We must wrap this because otherwise TS might pick the wrong overload
    (path: string) => urlHelpers.parse(path),
    pathLens.get,
);

const getParsedPathFromString = (maybePath: UrlWithStringQuery['path']): ParsedPath =>
    pipeWith(
        maybePath,
        maybe => mapMaybe(maybe, parsePath),
        maybe => getOrElseMaybe(maybe, () => ({ search: undefined, pathname: undefined })),
    );

const pathStringLens = pathLens.compose(
    new Lens(
        // TODO: well, get will always return, no?
        // TODO: return undefined if empty string?
        (parsedPath): string | undefined => urlHelpers.format(parsedPath),
        maybePath => () => getParsedPathFromString(maybePath),
    ),
);

const replacePathInParsedUrl = ({
    newPath,
}: {
    newPath: Update<UrlWithStringQuery['path']>;
}): MapUrlFn => ({ parsedUrl }) => pathStringLens.modify(newPath)(parsedUrl);

export const replacePathInUrl = flipCurried(
    pipe(
        replacePathInParsedUrl,
        mapUrl,
    ),
);

const pathnameLens = Lens.fromProp<UrlWithStringQuery>()('pathname');

// TODO: if we remove the named parameters, this would just become
// const replacePathnameInParsedUrl = pathnameLens.modify;
const replacePathnameInParsedUrl = ({
    newPathname,
}: {
    newPathname: Update<UrlWithStringQuery['pathname']>;
}): MapUrlFn => ({ parsedUrl }) => pathnameLens.modify(newPathname)(parsedUrl);

export const replacePathnameInUrl = flipCurried(
    pipe(
        replacePathnameInParsedUrl,
        mapUrl,
    ),
);

const appendPathnameToParsedUrl = ({ pathnameToAppend }: { pathnameToAppend: string }): MapUrlFn =>
    replacePathnameInParsedUrl({
        newPathname: prevPathname => {
            const pathnameParts = pipeWith(mapMaybe(prevPathname, getPartsFromPathname), maybe =>
                getOrElseMaybe(maybe, () => []),
            );
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

const hashLens = Lens.fromProp<UrlWithStringQuery>()('hash');

const replaceHashInParsedUrl = ({
    newHash,
}: {
    newHash: Update<UrlWithStringQuery['hash']>;
}): MapUrlFn => ({ parsedUrl }) => hashLens.modify(newHash)(parsedUrl);

export const replaceHashInUrl = flipCurried(
    pipe(
        replaceHashInParsedUrl,
        mapUrl,
    ),
);
