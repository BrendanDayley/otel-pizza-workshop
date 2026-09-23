# 2. Connect Dash0

**10 minutes.** You'll end with your fork connected to Dash0 and a dataset
waiting for data.

Nothing is sending telemetry yet. This segment is about getting the
destination ready and — more importantly — letting Agent0 see your source
code, so that in the next segment it can write the instrumentation itself.

## Sign up and find your dataset

Go to [dash0.com](https://dash0.com) and sign up with your email. You get
your own organisation on the free trial — everyone in the room has their
own, so nothing you do can confuse anyone else.

Ideally you did this as pre-work. It takes a couple of minutes, and they're
minutes better spent on the app.

**Note which region you land in.** It's in the URL and in your endpoints,
and you'll need it in a moment.

A **dataset** is where your telemetry lands. `default` is fine for today.

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

> **Copy the host from your own Endpoints page**, not from an example in
> these docs. Endpoints are region-specific, and a wrong region can fail
> quietly rather than loudly — "no traces anywhere" with everything else
> looking correct is usually this.

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
| `401` | The token. Re-copy it — they're long and easy to truncate. |
| `404` / connection failure | Wrong region in the URL. Copy the host from your own Endpoints page rather than from these docs. |
| anything else | Grab the host. |

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

If you forked from `dash0-community/otel-pizza-workshop` rather than cloning it
directly, you own a remote and this will work. If you cloned the Dash0 repo
directly, stop and fork now — you can't open PRs against a repo you don't own:

```bash
gh repo fork dash0-community/otel-pizza-workshop --remote
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
