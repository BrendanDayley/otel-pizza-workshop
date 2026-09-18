# Facilitator guide

> **Spoilers.** This file names both planted bugs and where they live. Don't
> put it on a projector, and don't let a participant's agent read it — see
> [/AGENTS.md](../../AGENTS.md).

> **Before the day: turn the hard block back on.** `AGENTS.md` asks agents
> not to read this directory; the enforced version is a deny rule, currently
> disabled so the docs can be edited. Restore it in
> `.claude/settings.json`:
> ```json
> { "permissions": { "deny": ["Read(./workshop-docs/**)"] } }
> ```
> With it active, Claude Code can't read or `find` in here at all. Leave it
> off while you're writing these docs — it blocks you too.

**Host:** Raphael Manke, Dash0 · 120 minutes · developers new to
OpenTelemetry.

Participants direct an agent; they don't write instrumentation. The skill
being taught is **judging whether an agent's answer about your telemetry is
actually true.**

## Timing

| Clock | Min | Segment | Who drives |
|---|---:|---|---|
| 0:00 | 10 | Run it. Watch it break. | participant |
| 0:10 | 10 | Connect Dash0 | participant |
| 0:20 | 20 | Agent0 instruments → PR → merge | agent |
| 0:40 | 15 | UI tour | **host** |
| 0:55 | 20 | Agent0 troubleshoots → PR → merge | agent |
| 1:15 | 15 | Alert | agent |
| 1:30 | 20 | Close the loop | agent |
| 1:50 | 10 | Wrap | host |

Segments 3 and 7 are where the clock slips. Segment 3 has a clean fallback;
segment 7 does not — if it stalls, demo it from the front and the session
still ends on the payoff.

## The two bugs

Both planted deliberately. Both surface in the browser as an identical, flat
`500 {"error": "Failed to process order"}`, because order-service's catch-all
flattens whatever it got from downstream.

**That masking is the entire argument of the workshop.** Two unrelated
failures, indistinguishable from the response, trivially distinguishable from
a trace.

### Bug 1 — Hawaiian (kitchen-service)

Commit `649cef6`, `pizza-app/kitchen-service/index.js`. `/cook` returns a
**403** for `pizzaType === 'Hawaiian'` with `"pineapple on pizza is
forbidden"`. Affects every Hawaiian order regardless of size.

Fix branch: `fix-1-pineapple` — removes the check.

### Bug 2 — Large (delivery-service)

Commit `92bb737`, `pizza-app/delivery-service/index.js`. The driver pool is
filtered by thermal-bag capacity through a size-rank table with a lowercase
key:

```js
const SIZE_RANK = { Small: 1, Medium: 2, large: 3 };
```

`SIZE_RANK['Large']` is `undefined`, so no driver is ever eligible for a
Large pizza and delivery returns **503**.

Second-order symptom a sharp participant may spot: drivers with
`bagSize: 'Large'` are excluded from *Medium* orders too (2 of 4 eligible
instead of 4 of 4), because their bag size misses the table as well.

Fix branch: `fix-2-size-rank` — `large: 3` → `Large: 3`.

### Verified behaviour

| Order | Result |
|---|---|
| Margherita Small | confirmed |
| Margherita Medium | confirmed |
| Margherita **Large** | 500 masking a **503** from delivery |
| **Hawaiian** Small | 500 masking a **403** from kitchen |

### Why two bugs

- One agent finding rarely explains everything, and a room that watches an
  agent produce a *partial* answer learns more than one that watches it
  produce a complete one.
- It forces the "are all failing traces explained by that cause?" follow-up,
  which is the single most transferable prompt in the deck.
- Different services, different status codes, same browser message.

## Branches

| Branch | What it is | Pushed? |
|---|---|---|
| `main` | Participant start state: no instrumentation, both bugs | **yes** |
| `fix-1-pineapple` | Removes the Hawaiian 403 | local only |
| `fix-2-size-rank` | One-line SIZE_RANK fix | local only |
| `solution` | Reference instrumentation, segment 3 fallback | local only |
| `upstream/main` | Julia Morgado's original, for diffing | upstream |

> **Pre-flight:** the participant docs point at `origin/solution` and the two
> fix branches as fallbacks. **Push them before the day** or those fallbacks
> don't exist:
> ```bash
> git push origin solution fix-1-pineapple fix-2-size-rank
> ```
> Pushing `solution` is safe — it's instrumentation, not fixes. Pushing the
> fix branches does put the answers on the remote; if that bothers you, keep
> them local and hand out patches instead.

## Running the room

**Don't debug one person's agent output from the front.** Note it, hand them
the fallback, move on. Divergence between agents is worth naming out loud in
segment 4 — "your span names differ from mine because a model chose them" is
a real lesson about agent-generated instrumentation.

**Segment 5 is the emotional peak.** Someone merges a PR written from their
own telemetry and watches the order go through. Let it land before moving on.

**Protect the two-prompt structure in segment 5.** Diagnose, *then* fix. If
people collapse it into one prompt they lose the only point in the workshop
where their judgement enters the loop.

## Blockers found in the first dry run

A full participant dry run on **2026-09-18** got through segment 1 exactly
as written, then stopped dead in segment 2/3 on two environment faults.
Neither is a docs problem. Both must be fixed before a room sits down.

### Root cause: the org's home region doesn't exist in that environment

Both faults are one fault. The API says so directly, in a response body the
UI never shows:

```json
{"error":"organization_region_mismatch",
 "error_description":"This organization is served from region 'aws-us-west-2',
   not 'aws-eu-west-1'. Re-issue the request against the organization's home region.",
 "expected_region":"aws-us-west-2","actual_region":"aws-eu-west-1"}
```

The WAD-Workshop org was created with `home_region = aws-us-west-2`, but
**`us-west-2` does not exist in `dash0-dev.com`** — `api.us-west-2.aws.dash0-dev.com`
and `ingress.us-west-2.aws.dash0-dev.com` are both NXDOMAIN; that region
only exists in production. eu-west-1 is the sole dev cell. The org is
unroutable by construction.

How it surfaced:

1. **Ingest 401.** `POST ingress.eu-west-1.aws.dash0-dev.com/v1/traces` →
   `401 invalid authentication token`. Misleading: eu-west-1's ingest plane
   has no record of a us-west-2 org and reports that as a bare auth failure.
   **The token was never the problem** — the same token returns 200 on
   `/api/dashboards` on the same host.
2. **Agent0 421.** `POST .../api/agents/agent0-sdk/threads` → 421, body as
   above. The browser showed only `Fatal Error`.

The dev cell itself is healthy — Dash0's own RUM forwarder accepted spans on
the same host.

**Nothing a participant can configure fixes this.** The org record has to be
corrected, or the org recreated in eu-west-1. Verify every participant org's
home region matches the environment it's served from before the day.

**And note what this breaks in our own advice:** the Endpoints page shows
the cell it is *served from*, not the org's home region, so "check your
endpoint against Organization settings → Endpoints" cannot detect it. The
participant picks the only endpoint offered and it is still wrong. The
pre-flight curl in segment 2 is the only thing that catches it.

3. **MCP pointed at a different organisation** — production
   `dash0-development`, 13 datasets — so Agent0 over MCP worked but couldn't
   see the workshop org at all. Segment 5's "ask from both places" would
   silently compare two different environments. Check what each participant's
   MCP endpoint is actually bound to.

Because of these, **segments 3-7 have still never been executed**, and the
open questions below are still open.

The run also confirmed the good part: both planted failures reproduce
exactly, returning `500` with `details` of `503` (Large) and `403`
(Hawaiian). Full notes and screenshots in [dry-run/](dry-run/).

## Open questions — answer before you send the pre-work mail

- [ ] **Can Agent0 write code and open PRs on a participant's fork?** Gates
      segments 3, 5 and 7. If it turns out read-only, segment 3 becomes
      Claude Code with the Dash0 OTel skills and the arc survives.
      → `__________`
- [ ] **Check rules and alert-triggered automation** — participant-drivable
      today? Gates segments 6 and 7. → `__________`
- [ ] **Token permission labels** for ingest vs Agent0. → `__________`
- [ ] **Individual signups or one shared org?** Shared pins the region and
      lets you debug anyone in seconds, but ~25 ingesters plus ~25 agents
      share one rate-limit bucket. → `__________`
- [ ] **Region.** Wrong region is a silent ingest failure whose only symptom
      is "no traces". Tell people theirs explicitly. → `__________`

## Not rehearsed

The full agent-driven arc has never been run end to end against a live Dash0
org. **Do a dry run of segments 3, 5, 6 and 7 in order before this is in
front of a room** — that dry run is also what answers the questions above.

What *has* been verified: `docker compose up` builds and runs, and the four
orders in the table above behave exactly as described.

## Deliberately out of scope

- **Hand-written spans, attributes, error handling** — good material for a
  longer session, cut here.
- **Metrics and logs** — traces only.
- **Browser/RUM** — the frontend uses plain `fetch`, so the trace root is
  always order-service. Say this out loud when someone asks why their click
  isn't in the trace.
- **Dashboards** — needs its own segment to be worth anything.
