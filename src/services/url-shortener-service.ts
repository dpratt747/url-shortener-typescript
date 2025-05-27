import { Effect } from "effect";
import * as O from "fp-ts/Option";
import { GetUrlPair, LongUrl, ShortUrl, asShortUrl } from "../domain/types";
import { DatabaseAlg } from "../persistence/database";

abstract class ShortenerServiceAlg {
    abstract store_long_url_and_get_short_url(
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

    store_long_url_and_get_short_url(
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
        throw new Error("Method not implemented.");
    }
    getLongUrlWithShortUrl(
        shortUrl: ShortUrl
    ): Effect.Effect<O.Option<LongUrl>, Error, never> {
        throw new Error("Method not implemented.");
    }
}
