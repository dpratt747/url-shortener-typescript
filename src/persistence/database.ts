import { LongUrl, ShortUrl, GetUrlPair, eqShortUrl } from "../domain/types";
import { Effect } from "effect";
import * as O from "fp-ts/Option";
import { Eq } from "fp-ts/Eq";

export abstract class DatabaseAlg {
    abstract store(
        longUrl: LongUrl,
        shortUrl: ShortUrl
    ): Effect.Effect<void, Error, never>;

    abstract getAll(): Effect.Effect<GetUrlPair[], Error, never>;

    abstract getLongUrlWithShortUrl(
        shortUrl: ShortUrl
    ): Effect.Effect<O.Option<LongUrl>, Error, never>;
}

export class InMemoryDatabase extends DatabaseAlg {
    constructor(private state: Map<LongUrl, ShortUrl>) {
        super();
    }

    private getKeyByValue<K, V>(
        map: Map<K, V>,
        targetValue: V,
        eq: Eq<V> // Using fp-ts Eq instead of custom function
    ): O.Option<K> {
        for (const [key, value] of map.entries()) {
            if (eq.equals(value, targetValue)) {
                return O.some(key);
            }
        }
        return O.none;
    }

    store(
        longUrl: LongUrl,
        shortUrl: ShortUrl
    ): Effect.Effect<void, Error, never> {
        return Effect.try({
            try: () => this.state.set(longUrl, shortUrl),
            catch: (error) => new Error(`Failed to store URL: ${error}`),
        });
    }

    getAll(): Effect.Effect<GetUrlPair[], Error, never> {
        return Effect.try({
            try: () =>
                Array.from(this.state.entries()).map(
                    ([longUrl, shortUrl]): GetUrlPair => ({ longUrl, shortUrl })
                ),
            catch: (error) => new Error(`Failed to store URL: ${error}`),
        });
    }

    getLongUrlWithShortUrl(
        shortUrl: ShortUrl
    ): Effect.Effect<O.Option<LongUrl>, Error, never> {
        return Effect.try({
            try: () => this.getKeyByValue(this.state, shortUrl, eqShortUrl),
            catch: (error) => new Error(`Failed to store URL: ${error}`),
        });
    }
}
