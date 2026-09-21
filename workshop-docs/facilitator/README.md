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

**Only `main` is pushed, deliberately.** The branch names alone give the
bugs away — a participant who runs `git branch -r` and sees
`fix-1-pineapple` has had segment 5 spoiled — so the answers stay off the
public remote.

**This makes you the fallback.** The participant docs no longer promise a
branch they can check out; they say "ask the host", in segments 3 and 5 and
in troubleshooting. Be ready to deliver, and decide *before* the day how:

```bash
# patches you can AirDrop / paste / put on a USB stick
git format-patch main..solution        -o ~/workshop-fallbacks/instrumentation
git format-patch main..fix-1-pineapple -o ~/workshop-fallbacks/fix-1
git format-patch main..fix-2-size-rank -o ~/workshop-fallbacks/fix-2
```

Alternatives, if patches feel clumsy in the room: push the branches under
neutral names on the morning (`fallback-a`, `fallback-b`) and delete them
afterwards, or just sit down next to the person and paste the diff.

**What there is no fallback for:** segments 6 and 7. If someone's check
rule or automation goes wrong there's no branch that helps — the recovery
is you, at their laptop, or letting them watch a neighbour.

## About the prompts

They're deliberately written as a non-expert would write them — plain
language, no OpenTelemetry vocabulary, and **no implementation detail**.
The point is to let Agent0 demonstrate what it works out unaided. A prompt
that names the approach only proves the participant already knew it.

This is a reversal of an earlier version, and it has a known cost. Prompt 1
used to name the environment variables explicitly, because in the dry run
the agent invented `DASH0_ENDPOINT` while `.env` said `DASH0_OTLP_ENDPOINT`
and the collector crash-looped. **That failure will now happen again.**
That's the intended trade:

- It's loud, not silent — the collector dies visibly and compose prints the
  reason.
- Segment 3's review checklist and troubleshooting both catch it.
- **Reviewing the agent's output is the deliverable of segment 3**, and a PR
  with nothing wrong in it teaches nobody to review.

If you'd rather protect the schedule than make the point, tell the room to
add "use exactly the variable names already in my .env" to Prompt 1. Know
that you're trading away the segment's best moment to save five minutes.

The same principle governs Prompt 2: it says almost nothing beyond "orders
are failing, what's going on?". The evidence discipline lives in the
follow-ups — *how do you know*, *is that everything*, *what couldn't you
tell* — which are the questions a curious non-expert asks anyway. The third
one produced the best answer of the dry run.

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

> **Since resolved by a decision, not a fix:** participants now sign up
> themselves at dash0.com and get their own trial organisation on
> production. The fault below was specific to a hand-provisioned org on the
> dev environment and **cannot occur on a self-service signup**, because
> the org is created in a region that exists. Kept here because the failure
> *signature* is worth recognising, and because it's the reason the
> pre-flight curl exists in segment 2.

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

### What ran once the region was fixed

Segment 3 then worked, and it answered the workshop's biggest open question:
**Agent0 wrote the instrumentation and opened the PR itself.**

What it produced, worth knowing because it differs from what the prompt
asked for:

- **A `--require ./instrumentation.js` bootstrap per service**, using
  `NodeSDK` with `getNodeAutoInstrumentations()` — not the `NODE_OPTIONS`
  env-var approach the prompt describes. Still auto-instrumentation, still
  no manual spans, but it added ~23 lines of code per service and pulled in
  metrics exporters nobody asked for. A fair thing to point at in segment 4
  when discussing agent divergence.
- **A collector on 4317/4318** with its own config file.
- **Invented environment variable names.** It wrote `${DASH0_ENDPOINT}`
  while `.env` had `DASH0_OTLP_ENDPOINT`, because `.env` is gitignored and
  it could not read it. Compose substituted an empty string and the
  collector crash-looped.

That last one is now covered three ways: Prompt 1 names the variables
explicitly, segment 3's review checklist has a `grep` comparison, and
troubleshooting has the crash-loop symptom. **It's also a genuinely good
teaching moment** — the failure was loud and the docs' own guidance found
it. Consider not over-protecting against it.

### Segments 4 and 5 ran — and segment 5 validated the whole design

**Agent0 found both bugs, unprompted. The documented nudge wasn't needed.**
It opened `fix/order-failures-size-rank-and-hawaiian-block` (PR #2 on the
fork) containing exactly the two reference fixes and nothing else: `large`
→ `Large` in `SIZE_RANK`, and the Hawaiian 403 block deleted. Nine lines.

What makes this a good demo rather than a lucky one:

- **It measured the failure rate** — ~44% over a 30-minute sample. Use that
  number in segment 6; it's real and it's awkward, which is the point.
- **It cited 14 trace IDs**, seven per cause, and they hold up when opened.
- **It explicitly refused the symptom fix**: "order-service's catch-all is
  untouched since it isn't the cause." That's the exact trap segment 5's
  review checklist warns about, declined without being asked.
- **It corroborated with span durations** — delivery 503 at ~103ms vs ~253ms
  for a successful assignment; kitchen 403 at ~1-7ms vs ~310ms for a cook.
- **Best of all, it stated what it could not know.** Unprompted, under a
  "Not checked" heading, it said it couldn't confirm pizza type and size
  from telemetry because those are request-body values the spans don't
  carry, and that its attribution rested on code paths plus the fact that
  7+7 accounted for every failure with none left over.

That last point is the workshop demonstrating its own thesis: segment 4
plants "the pizza type and size aren't there", segment 5 predicts it will
bite, and the agent hit exactly that wall and said so instead of asserting.
**Show the room that paragraph.**

It also declined to read `workshop-docs/`, announcing the exclusion
out loud. The `AGENTS.md` rule works.

One real gap it exposed, now fixed in segment 5 and troubleshooting: the
docs tell participants to "open the trace ID", and there is **no URL you
can construct** — `/traces/<id>` 404s. It's Tracing → funnel icon → paste,
matching on `otel.trace.id`. Without that sentence the entire
"verify, don't trust" discipline is unusable.

### Segments 6 and 7 — the loop closed

**2026-09-19. All seven segments have now run end to end.**

Segment 6: Agent0 looked up the real pre-fix rate rather than inventing one
("35 requests, 14 failed — 40%; per-5-minute windows ranged 37% to 50%"),
and answered "would this have fired?" by running the query. **Arguing with
it materially improved the rule** — three objections moved the window 5m →
15m, added a ≥20-request volume gate, and corrected a filter. It also
refused to over-claim from a baseline it found, calling its own threshold
"a judgment call with headroom, not anchored to a measured quiet period".

Segment 7, timed:

| UTC | |
|---|---|
| 16:58 | rebuilt on the revert, traffic starts |
| 17:02 | automation fires |
| 17:06 | **draft PR #3 opens on the fork** |

**Threshold breach → draft PR in about four minutes**, against roughly 25
for the human-driven version in segment 5. The run reported SUCCESS at
4m21s and 3.6 credits. PR #3 is a genuine investigation: measured ratio
45/56 = 80.36% with the evaluation window, the check rule's own PromQL
re-run against it, five failing trace IDs plus a successful comparison
trace, and file/line/commit for the cause. Draft confirmed via the API.

**It fixed one bug, not two — and it was right to.** The load traffic was
all Hawaiian Large; kitchen rejects those before delivery is ever called,
so the size-rank bug emitted no telemetry. An agent can only diagnose what
the traffic exercised. **This is the best teaching moment in the workshop**
— 07 now sends a mix and says so explicitly.

### Product issues worth raising

- **Agent0 proposes, the human clicks.** Both the check rule and the
  automation are preview cards with a button. Nothing is created until you
  press it and nothing warns you otherwise. Both docs now say so.
- **The UI sat on "Thinking…" for ~20 minutes** on a turn that took 2m34s,
  with an empty reasoning panel; the answer appeared, stamped with the real
  duration, only on click. **In a room of thirty this reads as "my agent is
  broken".** If it hangs past ~3 minutes, tell people to click into the
  thread or reload.
- **Agent0 stated a wrong fact about Dash0**: that `failed_check.new` has
  no per-rule filter, "confirmed by probing the validator". The UI has a
  **Check rules** picker. It then wrote a prompt-level guard instead of
  using it.
- **Stray Chinese characters** in one Agent0 sentence ("regardless of the
  ratio's 真实性"). Someone will screenshot it.

### Timing, from the real run

Segments 6 and 7 were budgeted 15 and 20 minutes and took ~35 and ~25.
Both are now 25 in the docs, which makes the total 150 rather than 120 —
**decide what to cut, or say up front that it's a half-day.** The honest
options are dropping segment 7 to a demo from the front, or shortening the
UI tour.

The run also confirmed the good part: both planted failures reproduce
exactly, returning `500` with `details` of `503` (Large) and `403`
(Hawaiian). Full notes and screenshots in [dry-run/](dry-run/).

## Open questions — answer before you send the pre-work mail

- [x] **Can Agent0 write code and open PRs on a participant's fork?**
      **YES — confirmed 2026-09-18.** Prompt 1 produced a real PR on a
      participant fork, authored by the `dash0-dev` GitHub App bot:
      `RaphaelManke/otel-pizza-workshop-dryrun#1`, +8126/-42 across 12
      files. Segments 3, 5 and 7 are viable as designed. The GitHub
      connector must be installed on the fork first, which needs a human
      OAuth grant — make that pre-work.
- [x] **Check rules and alert-triggered automation** — participant-drivable
      today? **YES, with one caveat: Agent0 proposes and the participant
      clicks a button to create.** Confirmed end to end 2026-09-19,
      including an alert-triggered automation that opened draft PR #3 on
      its own.
- [ ] **Token permission labels** for ingest vs Agent0. → `__________`
- [x] **Individual signups or one shared org?** **Individual.** Everyone
      signs up at dash0.com with their own email and gets their own trial
      organisation on production. No shared dataset to collide in, no
      shared rate-limit bucket, and no dev environment involved.
- [ ] **Region.** Wrong region is a silent ingest failure whose only symptom
      is "no traces". Tell people theirs explicitly. → `__________`

## Rehearsal status

**The full arc ran end to end on 2026-09-19**, segments 1 through 7, against
a live Dash0 org — including Agent0 writing the instrumentation, finding
both bugs, and an alert-triggered automation opening a draft PR by itself.

Caveats before you treat that as proof:

- **One run, by an agent, not a person.** It was more patient than a
  participant will be, and it never got confused by the UI in the way a
  newcomer does.
- **It needed a working org.** The first attempt died on the region
  mismatch; budget for at least one participant hitting an environment
  problem you can't fix in the room.
- **Timings came in over budget** on every agent-driven segment.
- **Nobody has run this with more than one participant**, so nothing is
  known about rate limits with ~25 ingesters and ~25 agents on one org.

## Deliberately out of scope

- **Hand-written spans, attributes, error handling** — good material for a
  longer session, cut here.
- **Metrics and logs** — traces only.
- **Browser/RUM** — the frontend uses plain `fetch`, so the trace root is
  always order-service. Say this out loud when someone asks why their click
  isn't in the trace.
- **Dashboards** — needs its own segment to be worth anything.
