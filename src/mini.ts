import {
    HttpApi,
    HttpApiBuilder,
    HttpApiEndpoint,
    HttpApiGroup,
} from "@effect/platform";
import { Effect, Schema } from "effect";
import { DatabaseTag } from "./persistence/database";
import { HttpApiDecodeError } from "@effect/platform/HttpApiError";

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
);

const URLShorternerLive = HttpApiBuilder.group(
    MyApi,
    "Url Shortener",
    (handlers) =>
        handlers.handle("get all urls", () =>
            Effect.flatMap(DatabaseTag, (db) =>
                Effect.mapError(
                    Effect.map(db.getAll(), (pairs) =>
                        pairs.map((pair) => ({
                            longUrl: pair.longUrl.value,
                            shortUrl: pair.shortUrl.value,
                        }))
                    ),
                    (error) => new HttpApiDecodeError({ 
                        message: error.message,
                        issues: [{ _tag: "Type", message: error.message, path: [] }]
                    })
                )
            )
        )
);

// const URLShorternerLive = HttpApiBuilder.group(
//     MyApi,
//     "Url Shortener",
//     (handlers) =>
//         handlers.handle("get all urls", () =>
//             Effect.flatMap(DatabaseTag, (db) =>
//                 Effect.map(db.getAll(), (pairs) =>
//                     pairs.map((pair) => ({
//                         longUrl: pair.longUrl.value,
//                         shortUrl: pair.shortUrl.value,
//                     }))
//                 )
//             )
//         )
// );
