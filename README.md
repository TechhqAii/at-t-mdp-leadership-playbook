# MDP Field Manual

A private, local-first leadership preparation system for AT&T’s Management Development Program.

## What is included

- **Command center:** the positioning strategy and 5–3–1 event mission
- **Sunday quick card:** a one-page, printable event-day reference
- **Rehearsal studio:** customizable 15-, 30-, and 60-second scripts, timer, private browser recording, and audio model tracks
- **Pressure room:** randomized executive questions with response frameworks
- **People briefings:** public-source context for Matt Cook and Shelley Goodman
- **Connection log:** local notes with Markdown export
- **Research notes:** source links, confidence labels, and explicit gaps

## Deploy to Vercel instantly

You can deploy this Field Manual to your Vercel account instantly with one click. It is 100% safe to deploy publicly because all personal facts and notes you enter in the app are stored strictly in your browser's local storage and are never committed to GitHub or sent to any server.

👉 **[Deploy to Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FTechhqAii%2Fat-t-mdp-leadership-playbook)**

Once deployed, you can access the Field Manual on your phone or tablet on the flight, fill in your details, and rehearse your pitches with the local audio recorder!

## Recommended way to open it locally

In Terminal:

```bash
cd "/Users/jj/Documents/AT&T MDP Leadership Playbook"
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173
```

The app has no package install, external analytics, login, or cloud database. Profile fields and connection notes use this browser’s `localStorage`. The optional rehearsal recording stays in memory and disappears after refresh.

## Fastest preparation sequence

1. Open **Rehearsal studio**.
2. Fill the three Gen AI Quote Quick fields with exact, honest details.
3. Rehearse the recommended 30-second introduction five times.
4. Complete three randomized **Pressure room** reps.
5. Read the **Sunday quick card** once before entering the event.
6. During the event, aim for **5 useful conversations, 3 specific follow-ups, and 1 relationship worth intentionally continuing**.

## Verification

Run:

```bash
node --check app.js
node verify.mjs
```

Browser QA should be completed from the local URL above. The exact 2026 MDP agenda was not found in a reliable public source; use the internal invitation and agenda as the source of truth.

## Privacy and scope

This is an unofficial personal preparation tool, not an AT&T website. It intentionally contains no account numbers, internal documents, private contact information, credentials, or confidential performance data. If you personalize it with internal facts, keep the folder private.
