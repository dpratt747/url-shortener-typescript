-   [Effect](https://effect.website/)
-   [fp-ts](https://gcanti.github.io/fp-ts/)

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
