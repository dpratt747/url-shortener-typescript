-   [Effect](https://effect.website/)
-   [Effect Platform](https://effect.website/docs/guides/platform/introduction)
-   [fp-ts](https://gcanti.github.io/fp-ts/)
-   [Http-Server](https://github.com/Effect-TS/effect/blob/main/packages/platform/README.md#http-server)

## Project setup:

```bash
npm init -y

npm install typescript @types/node --save-dev

npx tsc --init

mkdir src
touch src/index.ts

npm install ts-node nodemon --save-dev

```

## Running:

```bash
npm run dev
# or with nodemon:
npm run watch
```

## Production:

```bash
npm run build
npm run start
```

---

Like ZIO but flipped (confusingly):

Effect<A, E, R>
A -> actual value / success channel
E -> errors
R -> requirements /environment

## Running a typescript file:

```bash
ts-node src/test.ts
nodemon --exec ts-node src/test.ts
```

```ts
// Example using Express-style handler
app.get("/:shortUrl", async (req, res) => {
    const { shortUrl } = req.params;
    const urlEntry = await db.findUrlByShortCode(shortUrl);

    if (urlEntry) {
        return res.redirect(302, urlEntry.longUrl);
    }
    return res.status(404).send("URL not found");
});
```
