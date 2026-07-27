# Mapping Your Own AI Workflow

A single-page interactive worksheet for mapping your weekly tasks, spotting the slow or
repetitive ones, and matching each with the right AI tool.

- Enter your name to start — your answers autosave to your browser's local storage.
- Fill in up to 5 recurring tasks, flag which are slow / repetitive / first-draft, and
  pick a recommended AI tool for each — click ✨ next to any row to get a suggestion.
- Export your filled-in worksheet as a PDF at any time (enabled once each of the 3
  steps has at least one entry).

It's a static `index.html` plus one optional serverless function, so it deploys
anywhere that supports both (Vercel is the easiest — see below).

## Local preview

```bash
npx serve .
```

The ✨ suggestion button works locally too, without any setup — it falls back to a
built-in keyword-matching engine whenever the `/api/suggest-tool` endpoint isn't
available (which is always true under `npx serve`, since it only serves static files).

## Deploy

Import this repository into [Vercel](https://vercel.com/new). No framework or build
command is needed — Vercel auto-detects `index.html` as static output and
`api/suggest-tool.js` as a serverless function.

## Optional: real AI suggestions via Gemini

By default the ✨ button uses a local keyword-matching heuristic — no setup required.
To have it call the actual Gemini API instead:

1. Get a free API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. In your Vercel project: Settings → Environment Variables → add `GEMINI_API_KEY`
   with that value (Production + Preview).
3. Redeploy. The button will now call Gemini server-side (the key never reaches the
   browser); if the call ever fails for any reason, it silently falls back to the
   local heuristic so the feature never breaks.

Optionally set `GEMINI_MODEL` too (defaults to `gemini-2.0-flash`) to pick a
different Gemini model.
