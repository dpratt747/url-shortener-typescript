import { Context, Effect, Layer } from "effect";
import { Eq } from "fp-ts/Eq";
import * as O from "fp-ts/Option";
import { GetUrlPair, LongUrl, ShortUrl, eqShortUrl } from "../domain/types";

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
            catch: (error) => new Error(`Failed to get all URLs: ${error}`),
        });
    }

    getLongUrlWithShortUrl(
        shortUrl: ShortUrl
    ): Effect.Effect<O.Option<LongUrl>, Error, never> {
        return Effect.try({
            try: () => this.getKeyByValue(this.state, shortUrl, eqShortUrl),
            catch: (error) => new Error(`Failed to get long URL: ${error}`),
        });
    }
}

export const DatabaseTag = Context.GenericTag<DatabaseAlg>("DatabaseAlg");

export const InMemoryDatabaseLive = Layer.succeed(
    DatabaseTag,
    new InMemoryDatabase(new Map<LongUrl, ShortUrl>())
);
