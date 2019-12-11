import { Lens } from 'monocle-ts';
import { pipe, pipeWith } from 'pipe-ts';
import { ParsedUrlQueryInput } from 'querystring';
import * as urlHelpers from 'url';
import { UrlWithParsedQuery, UrlWithStringQuery } from 'url';
import { getOrElseMaybe, mapMaybe } from './helpers/maybe';
import { isNonEmptyString } from './helpers/other';

const getPathnameFromParts = (parts: string[]) => `/${parts.join('/')}`;

const getPartsFromPathname = (pathname: string) => pathname.split('/').filter(isNonEmptyString);

const parseUrlWithQueryString = (url: string): UrlWithParsedQuery =>
    urlHelpers.parse(
        url,
        // Parse the query string
        true,
    );

const parseUrlWithoutQueryString = (url: string): UrlWithStringQuery => urlHelpers.parse(url);

// TODO: remove search from "with parsed"
// TODO: remove query from "with search"

const urlLens = new Lens(parseUrlWithoutQueryString, p => () => urlHelpers.format(p));

// TODO: allow this somehow (i.e. set/modify should allow `Url` object, rather than `UrlWithStringQuery`)
urlLens.set({ port: 100 });

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

export const replaceQueryInParsedUrl = modify(queryInputLens);
export const replaceQueryInUrl = modify(urlWithParsedQueryLens.compose(queryInputLens));

export const addQueryToParsedUrl = (queryToAppend: ParsedUrlQueryInput) =>
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

export const replacePathInParsedUrl = modify(pathStringLens);
export const replacePathInUrl = modify(urlLens.compose(pathStringLens));

const pathnameLens = Lens.fromProp<UrlWithStringQuery>()('pathname');

export const replacePathnameInParsedUrl = modify(pathnameLens);
export const replacePathnameInUrl = modify(urlLens.compose(pathnameLens));

export const appendPathnameToParsedUrl = (pathnameToAppend: string) =>
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

export const replaceHashInParsedUrl = modify(hashLens);
export const replaceHashInUrl = modify(urlLens.compose(hashLens));
