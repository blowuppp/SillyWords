# Silly Words

A playful web app that collects "silly words". Type or speak a word and the app
talks back using the browser's speech synthesis, animating the word as it floats
up the screen. Words are stored in a Redis set so they persist between visits.

## How it works

- **Frontend** (`index.html`, `css/style.css`, `js/script.js`): a single-page app.
  Type or use the mic to send a word, or press **Silly Words** to hear a random
  saved word plus a funny phrase. Speech is produced with the Web Speech API
  (`speechSynthesis`).
- **Backend** (`netlify/functions/sillyword.js`): a Netlify serverless function.
  It filters banned words, enforces a length limit, stores new words in a Redis
  set (`silly_words`), and returns known/random words plus a funny phrase.

## Configuration

The function reads two environment variables (set them in the Netlify site
settings, or a local `.env` when running with the Netlify CLI):

| Variable                  | Description                          |
| ------------------------- | ------------------------------------ |
| `UPSTASH_REDIS_REST_URL`  | Redis REST endpoint URL              |
| `UPSTASH_REDIS_REST_TOKEN`| Bearer token for the Redis REST API  |

## Local development

```bash
npm install
npx netlify dev
```

This serves the static site and the function locally. Visit the URL printed by
the Netlify CLI.

## Deploy

Deployed on Netlify. `netlify.toml` configures the publish directory and the
`/api/*` redirect to the serverless functions.
