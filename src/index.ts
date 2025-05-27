import { Effect, Console, Runtime, Layer, Fiber } from "effect";
import { createServer, Server } from "http";

// Define the server as an Effect
const createServerEffect = Effect.async<Server, Error, never>((resume) => {
    try {
        const server = createServer((req, res) => {
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("Hello from Effect-powered server!");
        });

        // Success case
        resume(Effect.succeed(server));
        // resume(Effect.succeed(server));

        // Cleanup function
        return Effect.sync(() => {
            server.close();
        });
    } catch (error) {
        // Error case
        resume(Effect.fail(error as Error));
        return Effect.void;
    }
});

// Start the server with proper logging
const startServer = (server: Server, port: number) =>
    Effect.async<void, Error, never>((resume) => {
        server.listen(port, () => {
            resume(Effect.succeed(undefined));
        });

        return Effect.sync(() => {
            server.close();
        });
    });

// Main program
const program = Effect.gen(function* (_) {
    const port = 8080;
    // Create the server
    const server = yield* _(createServerEffect);

    // Start the server
    yield* _(startServer(server, port));

    // Log success message
    yield* _(Console.log(`Server running on http://localhost:${port}`));

    // Keep the server running (or add shutdown logic)
    yield* _(Effect.never);
});

// Run the program with error handling
Effect.runPromise(program).catch((error) =>
    Console.error(`Server failed: ${error}`).pipe(Effect.runPromise)
);
