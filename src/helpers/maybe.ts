// https://github.com/OliverJAsh/simple-maybe

type Maybe<T> = null | T;

export const isDefined = <T>(maybeT: Maybe<T>): maybeT is T => maybeT !== null;

// extend {} to ensure we're mapping to a non-null type
export const mapMaybe = <T, B extends {}>(f: (t: T) => B) => (maybeT: Maybe<T>): Maybe<B> =>
    isDefined(maybeT) ? f(maybeT) : maybeT;
export const getOrElseMaybe = <T>(fallback: () => T) => (maybeT: Maybe<T>): T =>
    isDefined(maybeT) ? maybeT : fallback();
