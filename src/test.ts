import {
    HttpApi,
    HttpApiBuilder,
    HttpApiEndpoint,
    HttpApiGroup,
    HttpApiSwagger,
} from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { HttpApiDecodeError } from "@effect/platform/HttpApiError";
import { Console, Effect, Layer, Schema } from "effect";
import { createServer } from "node:http";
import { LongUrl, ShortUrl } from "./domain/types";
import { DatabaseTag, InMemoryDatabase } from "./persistence/database";

const MyApi = HttpApi.make("Url Shortener").add(
    HttpApiGroup.make("Url Shortener").add(
        HttpApiEndpoint.get("get all urls")`/all`.addSuccess(
            Schema.Array(
                Schema.Struct({
                    longUrl: Schema.String,
                    shortUrl: Schema.String,
                })
            )
        )
    )
    // .add(
    //     HttpApiEndpoint.post("shorten long url")`/shorten`
    //         .setPayload(
    //             Schema.Struct({
    //                 longUrl: Schema.String,
    //             })
    //         )
    //         .addSuccess(
    //             Schema.String // returned the generated short url
    //         )
    // )
    // .add(
    //     HttpApiEndpoint.get("redirect to long url")`/:shortUrl`.addSuccess(
    //         Schema.Void
    //     )
    // )
);

// export const DatabaseTag = Context.Tag("DatabaseAlgService")<DatabaseAlg, never>();

const DatabaseLive = Layer.succeed(
    DatabaseTag,
    new InMemoryDatabase(new Map<LongUrl, ShortUrl>())
);

// const URLShorternerLive = HttpApiBuilder.group(
//     MyApi,
//     "Url Shortener",
//     (handlers) =>
//         handlers.handle("get all urls", () =>
//             Effect.flatMap(DatabaseTag, (db) =>
//                 Effect.map(db.getAll(), (pairs) => ({
//                     longUrl: pairs.longUrl.value,
//                     shortUrl: pairs.shortUrl.value
//             }))
//     // .handle("shorten long url", (request) =>
//     //     Effect.succeed(
//     //         `Shorten url is called ${request.payload.longUrl}`
//     //     )
//     // )
//     // .handle("redirect to long url", () => Effect.succeed(""))
// );

const URLShortenerLive = HttpApiBuilder.group(
    MyApi,
    "Url Shortener",
    (handlers) =>
        handlers.handle("get all urls", () =>
            Effect.flatMap(DatabaseTag, (db) =>
                db.getAll().pipe(
                    Effect.map((pairs) =>
                        pairs.map((pair) => ({
                            longUrl: pair.longUrl.value,
                            shortUrl: pair.shortUrl.value,
                        }))
                    ),
                    Effect.mapError(
                        (error) =>
                            new HttpApiDecodeError({
                                message: error.message,
                                issues: [
                                    {
                                        _tag: "Type",
                                        message: error.message,
                                        path: [],
                                    },
                                ],
                            })
                    )
                )
            )
        )
);

// Provide the implementation for the API
const MyApiLive = HttpApiBuilder.api(MyApi).pipe(
    Layer.provide(URLShortenerLive),
    Layer.provide(DatabaseLive)
    // Layer.provide(UrlShortenerServiceLive)
);

// Set up the server using NodeHttpServer on port 3000
const serverLive = (port: number) =>
    HttpApiBuilder.serve().pipe(
        Layer.provide(HttpApiSwagger.layer()),
        Layer.provide(MyApiLive),
        Layer.provide(NodeHttpServer.layer(createServer, { port }))
    );

// Launch the server at http://localhost:8080/docs

// Main program
const program = Effect.gen(function* (_) {
    const port = 8080;
    // Create the server
    const server = Layer.launch(serverLive(port)).pipe(NodeRuntime.runMain);

    // Start the server
    // Log success message
    yield* _(Console.log(`Server running on http://localhost:${port}`));

    // Keep the server running (or add shutdown logic)
    yield* _(Effect.never);
});

// Run the program with proper error handling
Effect.runPromise(program).catch((error) => {
    console.error("Server failed:", error);
    process.exit(1);
});
