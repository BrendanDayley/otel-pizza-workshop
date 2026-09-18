# 2. Connect Dash0

**10 minutes.** You'll end with your fork connected to Dash0 and a dataset
waiting for data.

Nothing is sending telemetry yet. This segment is about getting the
destination ready and — more importantly — letting Agent0 see your source
code, so that in the next segment it can write the instrumentation itself.

## Log in and find your dataset

Open Dash0 and sign in. **Use the URL your host gave you** — if you're on a
Dash0 dev or trial environment the host is not `app.dash0.com`, and every
link in these docs will land you in the wrong place. Write yours down here:

> My Dash0 URL: `__________________________`

A **dataset** is where your telemetry lands. The `default` dataset is fine for
today. If you're sharing an organisation with the rest of the room, the host
will tell you which one is yours — using someone else's makes the next two
hours confusing for both of you.

## Get your ingest credentials

You need two things, and you'll hand both to the agent in the next segment.

**Organization settings → Endpoints** lists *two* OTLP entries, and they look
different on purpose:

| Entry | Shape | Example |
|---|---|---|
| **OTLP via gRPC** | `host:port`, no scheme | `ingress.<region>.aws.dash0.com:4317` |
| **OTLP via HTTP** | scheme, no port | `https://ingress.<region>.aws.dash0.com` |

**Take the gRPC one.** Both work, but they need different exporter
configuration, and mixing them up is a silent failure — the collector starts
fine and nothing arrives. Pinning one now means the agent in segment 3 has
one obvious right answer.

Then **Organization settings → Auth Tokens** → create a token with ingest
rights.

> **The region matters more than you'd think.** Dash0 endpoints are
> region-specific, and sending to the wrong region doesn't error — it just
> silently succeeds into nowhere. If no traces show up in segment 4 and
> everything else looks right, this is the first thing to check.

Put them in an `.env` file at `pizza-app/.env`:

```bash
DASH0_OTLP_GRPC_ENDPOINT=ingress.<region>.aws.dash0.com:4317
DASH0_AUTH_TOKEN=<your token>
DASH0_DATASET=default
```

## Check the credentials actually work — don't skip this

Two minutes here saves the whole of the next segment. The Endpoints page
prints an example `curl`; run it, or this equivalent:

```bash
cd pizza-app
set -a; source .env; set +a

curl -i -X POST "https://ingress.<region>.aws.dash0.com/v1/traces" \
  -H "Authorization: Bearer $DASH0_AUTH_TOKEN" \
  -H "Dash0-Dataset: $DASH0_DATASET" \
  -H "Content-Type: application/json" \
  -d '{"resourceSpans":[]}'
```

Note the HTTP endpoint here — `curl` speaks HTTP, the collector will speak
gRPC. Same credentials either way.

| You get | Meaning |
|---|---|
| `200` | Good. Continue. |
| `401` | Token is wrong, or belongs to a different organization. |
| `404` / connection failure | Wrong region or wrong host. |
| `421` | The organization is being addressed on the wrong cluster — **tell your host, this is not something you can fix.** |

**Stop here if this doesn't return 200.** Everything from segment 3 onward
depends on it, and every downstream symptom will look like an
instrumentation problem instead of a credentials problem.

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
