# `url-transformers`

A small helper library for manipulating URL strings in Node and in the browser. `url-transformers` provides several functions for common URL transformations, such as adding a search/query string to a URL or appending to the URL pathname.

Currently `url-transformers` provides the following helpers:

-   `mapUrl`
-   `replaceQueryInUrl`
-   `addQueryToUrl`
-   `replacePathInUrl`
-   `replacePathnameInUrl`
-   `appendPathnameToUrl`
-   `replaceHashInUrl`

There are many more possibilities, so we would love for you to help us grow this collection!

Currently we don't have documentation, however the code is strongly typed using TypeScript, and it should be easy to scan the function signatures. See the [tests] for example usage.

## Installation

```sh
yarn add url-transformers
npm install url-transformers
```

## Dependencies

This project depends on [`monocle-ts`](https://github.com/gcanti/monocle-ts) (lenses library) and [`fp-ts`](https://github.com/gcanti/fp-ts). If tree shaking is used (via the `module` field in `package.json`) these dependencies will have a negligible impact on the bundle size—at the time of writing they only contribute ~500 bytes (gzipped) to the bundle.

## Development

```sh
yarn

npm run test

npm run prepublishOnly && npm version patch && npm publish && git push && git push --tags
```

[tests]: ./src/tests.ts
