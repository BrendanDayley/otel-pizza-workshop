# 3. Let Agent0 instrument it

**20 minutes.** You'll end with a merged PR and traces arriving in Dash0.

You are not going to write instrumentation. You're going to ask for it,
**review it**, and merge it. The review is the part that matters.

## Ask

In the **Dash0 app** — this step writes code, so it can't be MCP — start a new
Agent0 thread and use **Prompt 1** from [prompts.md](prompts.md).

You're asking, in plain terms, to be able to see what the app is doing —
and leaving the *how* to the agent. It has to decide on its own that this
means auto-instrumentation, a collector, an exporter and credentials
handling. Whether it decides well is what you're about to review.

While it works, read the next section — you'll want it ready.

## Review the PR before you merge

**Don't rubber-stamp this.** Four things to check, in priority order:

1. **Is your auth token committed?** Look for the literal token anywhere in
   the diff. It should appear only as `${DASH0_AUTH_TOKEN}` or similar,
   resolved from `.env` at runtime. If the agent pasted the real value into
   `docker-compose.yml` or a collector config, that's a leaked credential in
   your git history — reject it and say so.

2. **Is the service name set per service?** All three services reporting as
   `unknown_service:node` is technically instrumented and practically
   useless. You want `order-service`, `kitchen-service`, `delivery-service`.

3. **Is it auto-instrumentation, or did it hand-write spans?** Either can
   work, but auto-instrumentation via `NODE_OPTIONS` and the OTel env vars is
   what you asked for, it's ~0 lines of application code, and it's the honest
   demonstration. A PR full of manual `tracer.startSpan` calls has done more
   work than necessary.

4. **Does the collector actually route to Dash0?** An exporter block that
   points at `localhost:4317` with no auth header is a pipeline to nowhere.

5. **Do the environment variable names match your `.env`?** The agent
   couldn't read `.env` — it's gitignored — so it *invented* the names it
   expects. If it writes `${DASH0_ENDPOINT}` and your file says
   `DASH0_OTLP_GRPC_ENDPOINT`, compose substitutes an empty string and the
   collector dies on startup. Compare the two lists before you merge:
   ```bash
   grep -o 'DASH0_[A-Z_]*' docker-compose.yml otel-collector-config.yaml | sort -u
   cut -d= -f1 .env
   ```
   Either rename in `.env` or ask the agent to use your names. This one bit
   the first dry run.

Merge when you're happy.

## Pull and rebuild

From the repository root, on your `main` branch:

```bash
git checkout main
git pull origin main
cd pizza-app
docker compose up -d --build
```

Watch for the collector container starting. If it exits immediately, its
config didn't parse — `docker compose logs otel-collector` will say which
line.

## Generate some traffic

Order a few pizzas. Include at least one that failed in segment 1 — you want
a failing trace to look at in the next segment.

Then open Dash0 and find them. You're looking for a trace with roughly six
spans: the incoming request to order-service, its two outgoing HTTP calls, and
the server-side spans in kitchen and delivery.

## If nothing arrives

In this order, it's almost always one of these:

1. **Wrong region.** The single most common cause. Check your endpoint host
   matches the region your organisation is actually in.
2. **Collector isn't running.** `docker compose ps` — is it up?
3. **Services aren't exporting.** `docker compose logs order-service | head -30`
   — auto-instrumentation announces itself on startup.
4. **Token lacks ingest rights.** A wrong token usually shows up as a 401 in
   the collector logs.

[More in troubleshooting.md](troubleshooting.md)

## Stuck at minute 18?

Take the fallback. A working reference implementation exists — **ask the
host for the branch name**, then:

```bash
git fetch origin
git checkout -b my-instrumentation origin/<branch-the-host-gives-you>
cd pizza-app && docker compose up -d --build
```

You'll still need your own `.env` — the reference has the configuration, not
your credentials.

You'll rejoin the group with data flowing. Come back to your agent's output
later — what it got wrong is genuinely interesting, just not right now.

---

**Done when** you can see a trace from your own order in Dash0.

**Next:** [4. Find your way around →](04-explore.md)
