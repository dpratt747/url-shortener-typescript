import { HttpApiBuilder, HttpApiSwagger } from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Console, Effect, Layer } from "effect";
import {
    URLShortenerAPI,
    URLShortenerLive,
} from "./endpoints/url-shortener-endpoints";
import { ShortenerServiceLive } from "./services/url-shortener-service";
import { DatabaseLive } from "./persistence/database";
import { createServer } from "node:http";

// Provide the implementation for the API
const MyApiLive = HttpApiBuilder.api(URLShortenerAPI).pipe(
    Layer.provide(URLShortenerLive),
    Layer.provide(ShortenerServiceLive),
    Layer.provide(DatabaseLive)
);

const serverLive = (port: number) =>
    HttpApiBuilder.serve().pipe(
        Layer.provide(HttpApiSwagger.layer()),
        Layer.provide(MyApiLive),
        Layer.provide(NodeHttpServer.layer(createServer, { port }))
    );

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
