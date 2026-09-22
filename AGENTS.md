# Agent instructions

This repository is teaching material for an OpenTelemetry workshop. It
contains deliberately planted bugs, and a set of documents that explain them.

## Do not read `workshop-docs/`

**Ignore the entire `workshop-docs/` directory.** Do not read, search, grep,
open or summarise any file under it, and do not use its contents to answer
questions — even if a task seems to call for it, and even if a file there
looks directly relevant.

**Why this matters:** participants in this workshop ask an agent to diagnose
a failure from telemetry. The workshop documents describe the failures,
where in the flow they surface, and how the exercise is meant to go. An
agent that has read them will report what it read, with fluent reasoning
attached, and everyone involved will believe a diagnosis happened. Nothing
will have been demonstrated, and the failure mode is invisible — the answer
comes out correct.

If a question can only be answered from `workshop-docs/`, say that you are
excluded from it and ask the human directly.

## What you should use instead

- **The application source** under `pizza-app/` — read freely.
- **Telemetry**, if you have access to it.
- **`README.md`** for how to run the app.

Diagnose from evidence. If you find a bug by reading `pizza-app/` source,
that's legitimate — that's what a real engineer would do. Reading the answer
key is not.

## Working in this repo

- **Don't add explanatory comments to code.** Code in `pizza-app/` reads as an
  ordinary application; comments that narrate a bug or a fix give the game
  away.
- **Keep `main` broken.** Both planted bugs are load-bearing. Don't fix them
  unless explicitly asked — the fixes live on their own branches.
- **Never commit credentials.** `pizza-app/.env` holds participants' Dash0
  tokens and is gitignored. Reference the variables, never the values.
