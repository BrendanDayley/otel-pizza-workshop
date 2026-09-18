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

1. **Wrong region.** Your endpoint must match the region your organisation is
   in. The wrong region doesn't error; it accepts the data and you never see
   it. Check the endpoint host against Organization settings → Endpoints.

2. **Collector isn't running.**
   ```bash
   docker compose ps
   docker compose logs otel-collector
   ```
   An immediate exit means the config didn't parse. The log names the line.

3. **Services aren't exporting.** Auto-instrumentation announces itself at
   startup:
   ```bash
   docker compose logs order-service | head -30
   ```
   Nothing about OpenTelemetry means the instrumentation isn't loading — check
   `NODE_OPTIONS` made it into the container:
   ```bash
   docker compose exec order-service env | grep -i otel
   ```

4. **Auth token.** A 401 or 403 in the collector logs. Check the token has
   ingest rights, and that `.env` is actually being read — `docker compose
   config` shows the resolved values.

5. **You're looking at the wrong dataset.** Especially in a shared
   organisation.

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

## Agent0's answer sounds right but I can't verify it

That's the correct instinct, and the whole point of segment 5. Ask for trace
IDs and open them. If it can't produce one, treat the finding as a hypothesis
no matter how well written it is.

## I'm behind and the room has moved on

Take the fallback branch for the segment and rejoin. You lose the experience
of that one segment, not the rest of the workshop:

```bash
git fetch origin
git branch -r
```

Ask the host which branch you want — and don't spend the next segment
debugging the last one.
