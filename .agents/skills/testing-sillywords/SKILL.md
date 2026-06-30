---
name: testing-sillywords
description: Deploy and test the SillyWords Netlify + Redis web app end-to-end. Use when verifying SillyWords UI changes or deploying to Netlify.
---

# Testing SillyWords

SillyWords is a single-page web app (`index.html`, `css/style.css`, `js/script.js`)
with one Netlify serverless function (`netlify/functions/sillyword.js`) that stores
words in a Redis set (`silly_words`) via the Upstash REST API.

## Deploy from the CLI

Prod site is `verysillywords.netlify.app` (site ID `68384439-73b3-4c80-8253-8317bcaf9035`).
Env vars (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) live in the Netlify site
settings, so deploying does not touch them.

```bash
npm install
NETLIFY_AUTH_TOKEN="$NETLIFY_AUTH_TOKEN" npx netlify deploy --prod \
  --site 68384439-73b3-4c80-8253-8317bcaf9035 --dir . --functions netlify/functions
```

A Netlify personal access token is required. `npx netlify` downloads the CLI on first run
(answer `y` to the install prompt) — or `npm i -g netlify-cli` once.

## Quick backend smoke test (no browser)

```bash
curl -s -X POST https://verysillywords.netlify.app/api/sillyword \
  -H 'Content-Type: application/json' -d '{"random":true}'
# -> {"word":"...","phrase":"...","response":"..."}
```

## Primary UI flow (record this)

1. Open https://verysillywords.netlify.app/.
   - The breathing pink orb (`.orb`) should render in the top panel. If the panel is
     empty, the orb CSS rule may be broken (selector lost / missing width-height).
2. Type a new word + click **Send** → response should read
   "Thanks! I have not heard the word <word> before..." (Upstash write path).
3. Click **Silly Words** → returns a saved word + funny phrase (Upstash read path).

Note: speech (`speechSynthesis`) is silent on a headless VM — verify the on-screen
response text instead of audio.

## Devin Secrets Needed

- `NETLIFY_AUTH_TOKEN` — Netlify personal access token, only needed to deploy.
  Not needed for read-only browser testing of the already-deployed site.
