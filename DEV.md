```ts
import {
    HttpApi,
    HttpApiBuilder,
    HttpApiEndpoint,
    HttpApiGroup,
    HttpApiSwagger,
} from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Console, Effect, Layer, Schema } from "effect";
import { createServer } from "node:http";

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
            HttpApiEndpoint.get("redirect to long url")`/:shortUrl`.addSuccess(
                Schema.Void
            )
        )
);

const URLShorternerLive = HttpApiBuilder.group(
    MyApi,
    "Url Shortener",
    (handlers) =>
        handlers
            .handle("get all urls", () =>
                Effect.succeed([{ longUrl: "example.com", shortUrl: "abc123" }])
            )
            .handle("shorten long url", (request) =>
                Effect.succeed(
                    `Shorten url is called ${request.payload.longUrl}`
                )
            )
            .handle("redirect to long url", () => Effect.succeed(""))
);

// Provide the implementation for the API
const MyApiLive = HttpApiBuilder.api(MyApi).pipe(
    Layer.provide(URLShorternerLive)
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

Effect.runPromise(program).catch((error) =>
    Console.error(`Server failed: ${error}`).pipe(Effect.runPromise)
);
```
