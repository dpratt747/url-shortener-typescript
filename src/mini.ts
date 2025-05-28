import {
    ChannelSchema,
    HttpApi,
    HttpApiBuilder,
    HttpApiEndpoint,
    HttpApiGroup,
    HttpApiSchema,
    HttpServerResponse,
} from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Console, Effect, Layer, Schema } from "effect";
import { createServer } from "node:http";

const MyApi = HttpApi.make("Apis").add(
    HttpApiGroup.make("Some Redirect").add(
        HttpApiEndpoint.get("redirect to long url")`/:shortUrl`
            .setPath(
                Schema.Struct({
                    shortUrl: Schema.String,
                })
            )
            .addSuccess(Schema.Void, { status: 302 })
            .addError(Schema.String)
    )
);

const ApiLive = HttpApiBuilder.group(MyApi, "Some Redirect", (handlers) =>
    handlers.handleRaw("redirect to long url", (request) =>
        HttpServerResponse.empty({
            status: 302,
            headers: {
                "Location": "https://github.com/Effect-TS/effect/blob/main/packages/platform/README.md#http-server"
              }
        })
        // HttpServerResponse.redirect("https://github.com/Effect-TS/effect/blob/main/packages/platform/README.md#http-server")
    )
);

const MyApiLive = HttpApiBuilder.api(MyApi).pipe(Layer.provide(ApiLive));

const serverLive = (port: number) =>
    HttpApiBuilder.serve().pipe(
        Layer.provide(MyApiLive),
        Layer.provide(NodeHttpServer.layer(createServer, { port }))
    );

const program = Effect.gen(function* (_) {
    const port = 8080;
    const server = Layer.launch(serverLive(port)).pipe(NodeRuntime.runMain);
    yield* _(Console.log(`Server running on http://localhost:${port}`));
    yield* _(Effect.never);
});

Effect.runPromise(program).catch((error) => {
    console.error("Server failed:", error);
    process.exit(1);
});
