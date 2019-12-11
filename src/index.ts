import { Lens } from 'monocle-ts';
import { pipe, pipeWith } from 'pipe-ts';
import { ParsedUrlQueryInput } from 'querystring';
import * as urlHelpers from 'url';
import { UrlWithParsedQuery, UrlWithStringQuery } from 'url';
import { getOrElseMaybe, mapMaybe } from './helpers/maybe';
import { isNonEmptyString } from './helpers/other';

const getPathnameFromParts = (parts: string[]) => `/${parts.join('/')}`;

const getPartsFromPathname = (pathname: string) => pathname.split('/').filter(isNonEmptyString);

const parseUrlWithQueryString = (url: string) =>
    urlHelpers.parse(
        url,
        // Parse the query string
        true,
    );

// TODO: remove search from "with parsed"
// TODO: remove query from "with search"

// TODO: rm?
// TODO: ?
// type MapUrlFn = (parsedUrl: UrlWithStringQuery) => UrlObject;
type MapUrlFn = (parsedUrl: UrlWithStringQuery) => UrlWithStringQuery;

// TODO: overload issue workaround
// const urlLens = new Lens(urlHelpers.parse, p => () => urlHelpers.format(p));
const urlLens = new Lens((s: string) => urlHelpers.parse(s), p => () => urlHelpers.format(p));

// TODO: allow this somehow
urlLens.set({ port: 100 });

// TODO: rm?
// TODO: ?
// type MapUrlWithParsedQueryFn = (parsedUrl: UrlWithParsedQuery) => UrlObject;
type MapUrlWithParsedQueryFn = (parsedUrl: UrlWithParsedQuery) => UrlWithParsedQuery;

const urlWithParsedQueryLens = new Lens(parseUrlWithQueryString, p => () => urlHelpers.format(p));

const queryAndSearchLens = Lens.fromProps<UrlWithParsedQuery>()(['search', 'query']);

// TODO: or omit search somehow?
const queryLens = queryAndSearchLens.compose(
    new Lens(({ query }) => query, query => () => ({ search: null, query })),
);

// // TODO: not a lawful lens!
// const s: Pick<UrlWithParsedQuery, 'search' | 'query'> = { query: { foo: '1' }, search: 'a' };
// // 2. set(get(s))(s) = s
// assert.deepStrictEqual(queryLens.set(queryLens.get(s))(s), s); // error

const queryInputLens = queryLens.compose(
    new Lens(
        query => query as ParsedUrlQueryInput,
        query => () => query as UrlWithParsedQuery['query'],
    ),
);

// TODO
// This is a workaround for binding
const modify = <S, A>(lens: Lens<S, A>) => lens.modify.bind(lens);

const replaceQueryInParsedUrl = modify(queryInputLens);

export const replaceQueryInUrl = modify(urlWithParsedQueryLens.compose(queryInputLens));

const addQueryToParsedUrl = (queryToAppend: ParsedUrlQueryInput): MapUrlWithParsedQueryFn =>
    replaceQueryInParsedUrl(existingQuery => ({ ...existingQuery, ...queryToAppend }));

export const addQueryToUrl = pipe(
    addQueryToParsedUrl,
    modify(urlWithParsedQueryLens),
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
        maybe => getOrElseMaybe(maybe, () => ({ search: null, pathname: null })),
    );

const pathStringLens = pathLens.compose(
    new Lens(
        // TODO: well, get will always return, no?
        // TODO: return undefined if empty string?
        (parsedPath): string | null => urlHelpers.format(parsedPath),
        maybePath => () => getParsedPathFromString(maybePath),
    ),
);

// TODO: no longer needed?
// const replacePathInParsedUrl = pathStringLens.modify;
export const replacePathInUrl = modify(urlLens.compose(pathStringLens));

const pathnameLens = Lens.fromProp<UrlWithStringQuery>()('pathname');

const replacePathnameInParsedUrl = modify(pathnameLens);
export const replacePathnameInUrl = modify(urlLens.compose(pathnameLens));

const appendPathnameToParsedUrl = (pathnameToAppend: string): MapUrlFn =>
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
    modify(urlLens),
);

const hashLens = Lens.fromProp<UrlWithStringQuery>()('hash');

// TODO: no longer needed?
// const replaceHashInParsedUrl = hashLens.modify;
export const replaceHashInUrl = modify(urlLens.compose(hashLens));
