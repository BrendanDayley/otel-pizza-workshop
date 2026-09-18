# 2. Connect Dash0

**10 minutes.** You'll end with your fork connected to Dash0 and a dataset
waiting for data.

Nothing is sending telemetry yet. This segment is about getting the
destination ready and — more importantly — letting Agent0 see your source
code, so that in the next segment it can write the instrumentation itself.

## Log in and find your dataset

Open <https://app.dash0.com> and sign in.

A **dataset** is where your telemetry lands. The `default` dataset is fine for
today. If you're sharing an organisation with the rest of the room, the host
will tell you which one is yours — using someone else's makes the next two
hours confusing for both of you.

## Get your ingest credentials

You need two things, and you'll hand both to the agent in the next segment:

| What | Where |
|---|---|
| **Endpoint** | Organization settings → Endpoints → OTLP |
| **Auth token** | Organization settings → Auth Tokens → create one with ingest rights |

Copy them somewhere you can paste from.

> **The region matters more than you'd think.** Dash0 endpoints are
> region-specific, and sending to the wrong region doesn't error — it just
> silently succeeds into nowhere. If no traces show up in segment 4 and
> everything else looks right, this is the first thing to check.

Put them in an `.env` file at `pizza-app/.env`:

```bash
DASH0_OTLP_ENDPOINT=<your endpoint>
DASH0_AUTH_TOKEN=<your token>
```

`.env` is already gitignored. **Keep it that way** — when you review the
agent's PR in the next segment, one of the things you're checking is that it
referenced these variables rather than pasting your token into a committed
file.

## Connect your fork

Organization settings → Integrations → GitHub. Install the connector and give
it access to **your fork** of `otel-pizza-workshop`.

This is the step that makes the rest of the workshop work. It's what lets
Agent0:

- read your source when you ask it to instrument the app (segment 3)
- read your source when it's diagnosing a failure (segment 5)
- open pull requests against your fork (segments 3, 5 and 7)

If you forked from `dash0hq/otel-pizza-workshop` rather than cloning it
directly, you own a remote and this will work. If you cloned the Dash0 repo
directly, stop and fork now — you can't open PRs against a repo you don't own:

```bash
gh repo fork dash0hq/otel-pizza-workshop --remote
```

## Optional: MCP from your editor

If you want to ask Agent0 questions from your editor as well as from the Dash0
app, connect the MCP endpoint (Organization settings → Endpoints → MCP).

Worth doing — in segment 5 it's interesting to ask the same question from both
places. Just remember the limitation: **over MCP Agent0 reads and diagnoses
only.** When you want a PR, you continue the thread in the Dash0 app.

---

**Done when** your fork shows as connected in Dash0, your dataset exists, and
your endpoint and token are in `pizza-app/.env`.

**Next:** [3. Let Agent0 instrument it →](03-instrument.md)
