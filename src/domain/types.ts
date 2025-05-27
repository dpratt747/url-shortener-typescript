import { Eq } from "fp-ts/Eq";

// Long URL

export type LongUrl = {
    readonly value: string;
};

export function asLongUrl(value: string): LongUrl {
    return { value };
}

export const eqLongUrl: Eq<LongUrl> = {
    equals: (x, y) => x.value === y.value,
};

// Short URL

export type ShortUrl = {
    readonly value: string;
};

export function asShortUrl(value: string): ShortUrl {
    return { value };
}

export const eqShortUrl: Eq<ShortUrl> = {
    equals: (x, y) => x.value === y.value,
};

// GetURLPair
export type GetUrlPair = {
    readonly longUrl: LongUrl;
    readonly shortUrl: ShortUrl;
};
