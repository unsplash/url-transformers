// https://github.com/OliverJAsh/simple-maybe

type Maybe<T> = undefined | null | T;

export const isDefined = <T>(maybeT: Maybe<T>): maybeT is T =>
    maybeT !== undefined && maybeT !== null;

// extend {} to ensure we're mapping to a non-null type
export const mapMaybe = <T, B extends {}>(maybeT: Maybe<T>, f: (t: T) => B): Maybe<B> =>
    isDefined(maybeT) ? f(maybeT) : maybeT;
export const getOrElseMaybe = <T>(maybeT: Maybe<T>, fallback: () => T): T =>
    isDefined(maybeT) ? maybeT : fallback();
