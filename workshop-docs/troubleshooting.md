# Troubleshooting

Grab the host if you're stuck for more than two minutes. Falling behind
quietly is the worst outcome — every segment depends on the one before it.

## The app won't start

**Port already in use.** Something else holds 3000, 3001, 3002 or 8080:

```bash
lsof -i :3000
```

**Containers exit immediately.** Look at why before restarting:

```bash
docker compose ps
docker compose logs order-service
```

**Build fails.** Usually a cache or a JSON typo:

```bash
docker compose build --no-cache
```

**Nuclear option.** Takes a few minutes to rebuild, fixes most states:

```bash
docker compose down -v
docker compose up --build
```

## I changed a file and nothing happened

The services are baked into images. Editing a file on disk doesn't touch the
running container:

```bash
docker compose up -d --build
```

This catches almost everyone at least once, usually right after merging a PR.

## The frontend loads but every order fails instantly

If *every* order fails — including the ones that worked earlier — it's
usually not the app:

- Check the browser devtools Network tab. A CORS error or a connection
  refused means order-service isn't reachable, not that the order is invalid.
- `docker compose ps` — is order-service actually up?
- If you're running the app somewhere other than your laptop (a VM, a
  Codespace), the frontend calls order-service on the same host at port 3000.
  That port needs to be reachable from your browser.

## No traces in Dash0

In this order — the first one accounts for most cases:

1. **Credentials never worked in the first place.** Re-run the `curl` check
   from the end of [segment 2](02-connect-dash0.md). If that doesn't return
   `200`, nothing downstream can work and you're debugging the wrong layer.
   A `421` in particular is not yours to fix — tell the host.

2. **Wrong region.** Your endpoint must match the region your organisation
   is in — copy the host from your own Organization settings → Endpoints,
   not from an example. A wrong region can fail quietly rather than loudly.

3. **Collector isn't running.**
   ```bash
   docker compose ps
   ```
   There should be a collector container — whatever the agent named it in
   segment 3. If there isn't one at all, the PR you merged didn't add it,
   and that's your problem right there. If it's there but exited, its config
   didn't parse; `docker compose logs <that-container>` names the line.

4. **Services aren't exporting.** Auto-instrumentation announces itself at
   startup:
   ```bash
   docker compose logs order-service | head -30
   ```
   Nothing about OpenTelemetry means the instrumentation isn't loading — check
   `NODE_OPTIONS` made it into the container:
   ```bash
   docker compose exec order-service env | grep -i otel
   ```

5. **Auth token.** A 401 or 403 in the collector logs. Check `.env` is
   actually being read — `docker compose config` shows the resolved values
   — and that the token didn't get truncated on the way in.

6. **You're looking at the wrong dataset**, or a time range that predates
   your first trace.

## The collector starts, then immediately dies — over and over

Check compose's own output first. A line like:

```
WARN The "DASH0_ENDPOINT" variable is not set. Defaulting to a blank string.
```

means the name the agent used doesn't exist in your `.env`, so the endpoint
resolved to nothing. Compare the two:

```bash
grep -o 'DASH0_[A-Z_]*' docker-compose.yml otel-collector-config.yaml | sort -u
cut -d= -f1 .env
```

Rename in `.env` to match, or go back to the agent and tell it which names
you actually have. **This is a good failure** — it's loud. The dangerous
version is a collector that starts happily and drops everything.

## Traces arrive but they're all separate

One span per service, no connected trace. The context isn't propagating — the
instrumentation is loading for the HTTP server but not patching the outgoing
axios calls. Check that auto-instrumentation is loaded via `NODE_OPTIONS`
before the app starts, not `require`d somewhere inside it.

## Everything reports as unknown_service:node

`OTEL_SERVICE_NAME` isn't set per service. Each service needs its own value —
it's usually a compose file with the env var set once at the wrong level, or
copied and not edited.

## Agent0 says it can't open a PR

Two likely causes:

1. **You're on MCP.** Over MCP Agent0 reads and diagnoses only. Continue the
   thread in the Dash0 app.
2. **The GitHub connector doesn't have your fork.** Organization settings →
   Integrations → GitHub, and confirm the installation includes your fork
   specifically.

## I have a trace ID but I can't open it

In the Dash0 app, Agent0 embeds the traces as interactive widgets in its
answer — click them rather than copying IDs around.

If you have a bare ID (asking over MCP gives you those), paste it into the
filter on the **Tracing** page; it matches on `otel.trace.id`. Don't try to
build a URL out of it.

## Agent0's answer sounds right but I can't verify it

That's the correct instinct, and the whole point of segment 5. Open the
traces it showed you and check they say what it claims. If it can't point
at any, treat the finding as a hypothesis no matter how well written it is.

## I'm behind and the room has moved on

**Ask the host for the reference version of the segment you're stuck on.**
They have working ones for the agent-driven steps and can get you caught up
in a couple of minutes.

You lose the experience of that one segment, not the rest of the workshop —
and every segment after it depends on this one having worked. Don't spend
the next segment debugging the last one.
