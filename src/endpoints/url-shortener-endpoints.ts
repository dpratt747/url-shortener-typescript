import {
    HttpApi,
    HttpApiBuilder,
    HttpApiEndpoint,
    HttpApiGroup,
    HttpApiSchema,
    HttpServerResponse,
} from "@effect/platform";
import { Effect, Schema } from "effect";
import * as O from "fp-ts/Option";
import { asLongUrl, asShortUrl, LongUrl, ShortUrl } from "../domain/types";
import { ShortenerServiceTag } from "../services/url-shortener-service";

const getAllProgram = Effect.flatMap(ShortenerServiceTag, (service) =>
    service.getAll().pipe(
        Effect.map((pairs) =>
            pairs.map((pair) => ({
                longUrl: pair.longUrl.value,
                shortUrl: pair.shortUrl.value,
            }))
        ),
        Effect.mapError((error) => ({
            message: error.message,
        }))
    )
);

const shortenUrlProgram = (longUrl: LongUrl) =>
    Effect.flatMap(ShortenerServiceTag, (service) =>
        service.storeLongUrlAndGetShortUrl(longUrl).pipe(
            Effect.map((shortUrl) => `http://localhost:8080/${shortUrl.value}`), //todo: find a better way to pass the domain and port
            Effect.mapError((error) => ({
                message: error.message,
            }))
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
            Effect.mapError((error) => ({
                message: error.message,
            }))
        )
    );

export const URLShortenerAPI = HttpApi.make("Url Shortener").add(
    HttpApiGroup.make("Url Shortener")
        .add(
            HttpApiEndpoint.get("get all urls")`/all`
                .addSuccess(
                    Schema.Array(
                        Schema.Struct({
                            longUrl: Schema.String,
                            shortUrl: Schema.String,
                        })
                    )
                )
                .addError(
                    Schema.Struct({
                        message: Schema.String,
                    })
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
                .addError(
                    Schema.Struct({
                        message: Schema.String,
                    })
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
                .addError(
                    Schema.Struct({
                        message: Schema.String,
                    })
                )
        )
);

export const URLShortenerLive = HttpApiBuilder.group(
    URLShortenerAPI,
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
