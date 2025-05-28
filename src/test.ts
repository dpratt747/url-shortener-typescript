import {
    HttpApi,
    HttpApiBuilder,
    HttpApiEndpoint,
    HttpApiGroup,
    HttpApiSchema,
    HttpApiSwagger,
    HttpServerResponse,
} from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { HttpApiDecodeError } from "@effect/platform/HttpApiError";
import { Console, Effect, Layer, Schema } from "effect";
import * as O from "fp-ts/Option";
import { createServer } from "node:http";
import { asLongUrl, asShortUrl, LongUrl, ShortUrl } from "./domain/types";
import { DatabaseLive } from "./persistence/database";
import {
    ShortenerServiceLive,
    ShortenerServiceTag,
} from "./services/url-shortener-service";

const getAllProgram = Effect.flatMap(ShortenerServiceTag, (service) =>
    service.getAll().pipe(
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
);

const shortenUrlProgram = (longUrl: LongUrl) =>
    Effect.flatMap(ShortenerServiceTag, (service) =>
        service.storeLongUrlAndGetShortUrl(longUrl).pipe(
            Effect.map((shortUrl) => `http://localhost:8080/${shortUrl.value}`), //todo: find a better way to pass the domain and port
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
    );

const redirectUrlProgram = (shortUrl: ShortUrl) =>
    Effect.flatMap(ShortenerServiceTag, (service) =>
        service.getLongUrlWithShortUrl(shortUrl).pipe(
            Effect.flatMap((maybeLongUrl) =>
                Effect.succeed(
                    O.fold(
                        () =>
                            HttpServerResponse.empty({
                                status: 400,
                            }),
                        (longUrl: LongUrl) =>
                            HttpServerResponse.redirect(longUrl.value)
                    )(maybeLongUrl)
                )
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
    );

const MyApi = HttpApi.make("Url Shortener").add(
    HttpApiGroup.make("Url Shortener")
        .add(
            HttpApiEndpoint.get("get all urls")`/all`.addSuccess(
                Schema.Array(
                    Schema.Struct({
                        longUrl: Schema.String,
                        shortUrl: Schema.String,
                    })
                )
            )
        )
        .add(
            HttpApiEndpoint.post("shorten long url")`/shorten`
                .setPayload(
                    Schema.Struct({
                        longUrl: Schema.String,
                    })
                )
                .addSuccess(
                    Schema.String // returned the generated short url
                )
        )
        .add(
            HttpApiEndpoint.get("redirect to long url")`/:shortUrl`
                .setPath(
                    Schema.Struct({
                        shortUrl: Schema.String,
                    })
                )
                .addSuccess(HttpApiSchema.NoContent, { status: 302 })
                .addError(Schema.String)
        )
);

const URLShortenerLive = HttpApiBuilder.group(
    MyApi,
    "Url Shortener",
    (handlers) =>
        handlers
            .handle("get all urls", () => getAllProgram)
            .handle("shorten long url", (request) =>
                shortenUrlProgram(asLongUrl(request.payload.longUrl))
            )
            .handleRaw("redirect to long url", (request) =>
                redirectUrlProgram(asShortUrl(request.path.shortUrl))
            )
);

// Provide the implementation for the API
const MyApiLive = HttpApiBuilder.api(MyApi).pipe(
    Layer.provide(URLShortenerLive),
    Layer.provide(ShortenerServiceLive),
    Layer.provide(DatabaseLive)
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
