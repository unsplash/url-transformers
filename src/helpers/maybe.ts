// https://github.com/OliverJAsh/simple-maybe

type Maybe<T> = undefined | T;

export const isNotUndefined = <T>(maybeT: Maybe<T>): maybeT is T => maybeT !== undefined;

// extend {} to ensure we're mapping to a non-null type
export const mapMaybe = <T, B extends {}>(maybeT: Maybe<T>, f: (t: T) => B): Maybe<B> =>
    isNotUndefined(maybeT) ? f(maybeT) : maybeT;
export const getOrElseMaybe = <T>(maybeT: Maybe<T>, fallback: () => T): T =>
    isNotUndefined(maybeT) ? maybeT : fallback();
