import { Console, Effect } from "effect";
import { LongUrl, ShortUrl, asLongUrl, asShortUrl } from "./domain/types";
import { InMemoryDatabase } from "./persistence/database";
import { UrlShortenerService } from "./services/url-shortener-service";

// console.log(map);

// console.log(Array.from(map));

// const heeelo = 1002;

// const asUrlPair = Array.from(map.entries()).map(
//     ([longUrl, shortUrl]): GetUrlPair => ({
//         longUrl,
//         shortUrl,
//     })
// );

// console.log(asUrlPair);
// console.log(typeof asUrlPair);

function generateAlphanumeric(length: number): string {
    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";

    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
}

// const smallProgram = Effect.gen(function* (_) {
//     const db = new InMemoryDatabase(new Map<LongUrl, ShortUrl>());
//     const longUrl = asLongUrl("something very long and very wrong");
//     const shortUrl = yield* _(
//         Effect.try({
//             try: () => asShortUrl(generateAlphanumeric(5)),
//             catch: (error) => new Error(`Failed to store URL: ${error}`),
//         })
//     );
//     yield* _(db.store(longUrl, shortUrl));
//     return shortUrl;
// });

const program = Effect.gen(function* (_) {
    // Create the server
    const db = new InMemoryDatabase(new Map<LongUrl, ShortUrl>());
    const service = new UrlShortenerService(db);
    const longUrl = asLongUrl(
        "something very long long as it is 1 this is not long enough is it"
    );
    // Start the server
    // yield* _(
    //     db.store(
    //         asLongUrl("something very long long as it is 1"),
    //         asShortUrl("short")
    //     )
    // );
    const shortUrl = yield* _(
        service.store_long_url_and_get_short_url(longUrl)
    );

    yield* _(Console.log("returned short url:", shortUrl));

    // If you want to log the db state, do it here:
    yield* _(Console.log("Database state:", db));
});

Effect.runSync(program);
