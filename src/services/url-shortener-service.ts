import { Context, Effect, Layer } from "effect";
import * as O from "fp-ts/Option";
import { GetUrlPair, LongUrl, ShortUrl, asShortUrl } from "../domain/types";
import { DatabaseAlg, DatabaseTag } from "../persistence/database";

abstract class ShortenerServiceAlg {
    abstract storeLongUrlAndGetShortUrl(
        longUrl: LongUrl
    ): Effect.Effect<ShortUrl, Error, never>;

    abstract getAll(): Effect.Effect<GetUrlPair[], Error, never>;

    abstract getLongUrlWithShortUrl(
        shortUrl: ShortUrl
    ): Effect.Effect<O.Option<LongUrl>, Error, never>;
}

export class UrlShortenerService extends ShortenerServiceAlg {
    constructor(private database: DatabaseAlg) {
        super();
    }

    private generateAlphanumeric(length: number): string {
        const chars =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";

        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return result;
    }

    storeLongUrlAndGetShortUrl(
        longUrl: LongUrl
    ): Effect.Effect<ShortUrl, Error, never> {
        const self = this;
        return Effect.gen(function* (_) {
            const shortUrl = yield* _(
                Effect.try({
                    try: () => asShortUrl(self.generateAlphanumeric(5)),
                    catch: (error) =>
                        new Error(`Failed to store URL: ${error}`),
                })
            );
            yield* _(self.database.store(longUrl, shortUrl));
            return shortUrl;
        });
    }

    getAll(): Effect.Effect<GetUrlPair[], Error, never> {
        return this.database.getAll();
    }

    getLongUrlWithShortUrl(
        shortUrl: ShortUrl
    ): Effect.Effect<O.Option<LongUrl>, Error, never> {
        return this.database.getLongUrlWithShortUrl(shortUrl);
    }
}

export const ShortenerServiceTag =
    Context.GenericTag<ShortenerServiceAlg>("ShortenerService");

export const ShortenerServiceLive = Layer.effect(
    ShortenerServiceTag,
    Effect.gen(function* () {
        const db = yield* DatabaseTag;
        return new UrlShortenerService(db); // Database depends on Config & Logger
    })
);
