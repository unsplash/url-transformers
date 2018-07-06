export const isNonEmptyString = (str: string) => str.length > 0;

// https://github.com/gcanti/fp-ts/blob/15f4f701ed2ba6b0d306ba7b8ca9bede223b8155/src/function.ts#L127
export const flipCurried = <A, B, C>(fn: (a: A) => (b: B) => C) => (b: B) => (a: A) => fn(a)(b);
