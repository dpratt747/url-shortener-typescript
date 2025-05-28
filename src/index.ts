import { HttpApiBuilder, HttpApiSwagger } from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Console, Effect, Layer } from "effect";
import {
    URLShortenerAPI,
    URLShortenerLive,
} from "./endpoints/url-shortener-endpoints";
import { ShortenerServiceLive } from "./services/url-shortener-service";
import { InMemoryDatabaseLive } from "./persistence/database";
import { createServer } from "node:http";

// Provide the implementation for the API
const MyApiLive = HttpApiBuilder.api(URLShortenerAPI).pipe(
    Layer.provide(URLShortenerLive),
    Layer.provide(ShortenerServiceLive),
    Layer.provide(InMemoryDatabaseLive)
);

const serverLive = (port: number) =>
    HttpApiBuilder.serve().pipe(
        Layer.provide(HttpApiSwagger.layer()),
        Layer.provide(MyApiLive),
        Layer.provide(NodeHttpServer.layer(createServer, { port }))
    );

const program = Effect.gen(function* (_) {
    const port = 8080;
    Layer.launch(serverLive(port)).pipe(NodeRuntime.runMain);

    yield* _(Console.log(`Server running on http://localhost:${port}`));

    yield* _(Effect.never);
});

Effect.runPromise(program).catch((error) => {
    console.error("Server failed:", error);
    process.exit(1);
});
