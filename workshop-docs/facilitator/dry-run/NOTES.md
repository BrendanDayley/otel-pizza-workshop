# OpenTelemetry Pizza Workshop — participant dry run

Date: 2026-09-18. Repo checkout: /Users/rm/code/dash0/dash0-claude/clam (branch main).
Dash0 env used: app.dash0-dev.com (docs say app.dash0.com).

---

## Segment 0 — README / prerequisites

**What I did:** read `workshop-docs/README.md`.

Issues spotted before even starting:

- Prereq says "Forked <https://github.com/dash0hq/otel-pizza-workshop> and cloned
  *your fork*". My checkout is a directory called `clam`, not `otel-pizza-workshop`.
  A participant following literally will have a differently-named directory; harmless,
  but the docs never say "from here on, `pizza-app` is relative to the repo root."
- "**A Dash0 account**, and you know which region it's in" — nothing in the README
  says how to find out which region you're in, and region matters a lot in segment 2
  (endpoint hostname). This is assumed knowledge.
- "Ports free: 3000, 3001, 3002, 8080, and 4317/4318 for later" — no command given to
  check. Minor.
- No mention anywhere of the `dash0-dev.com` vs `app.dash0.com` distinction. The URL I
  was given is `app.dash0-dev.com`; every doc link points at `app.dash0.com`. If a
  participant is onboarded onto a dev/staging org, every deep link in the docs is wrong
  and they will silently land in the wrong (or empty) org.
- README says each segment has "a fallback branch you can check out in thirty seconds"
  but never says how those branches are named or where the list is. You have to ask the
  host. Naming them in the README would cost one line.

### Fork setup (done for me, not by me)

A fork was provisioned for this dry run: https://github.com/RaphaelManke/otel-pizza-workshop-dryrun
(forked from dash0hq/otel-pizza-workshop). I did **not** perform the fork/clone myself, so
I can only review the written fork instructions, not execute them.

Reviewing them as written: the README prereq is one bullet — "Forked
<https://github.com/dash0hq/otel-pizza-workshop> and cloned *your fork*". What it does not say:
- whether to clone over SSH or HTTPS (matters if the participant has no SSH key on the box)
- that the local clone must have a push-capable remote for segments 3/5/7, and that Agent0's
  PRs land on GitHub, not locally — so the participant needs to `git pull` to see them
- nothing about keeping `upstream` for the fallback branches the README promises. If the
  fallback branches live on **dash0hq/otel-pizza-workshop** and you cloned your fork, you
  cannot `git checkout <fallback>` without adding an upstream remote and fetching first.
  The README says "check out in thirty seconds" — it is not thirty seconds if you have to
  work that out yourself. This is a real trap.

---

## Segment 1 — Run it. Watch it break. (budget 10 min; took ~8 min)

**What I did:** `docker compose down`, then `docker compose up`, opened localhost:8080,
placed the four documented orders.

**Result — the documented failures DID reproduce, exactly two of four:**

| # | Pizza | Size | Outcome |
|---|---|---|---|
| 1 | Margherita | Small | OK — "Order Confirmed!", driver Peach, 18 min |
| 2 | Margherita | Medium | OK — 23 min |
| 3 | Margherita | Large | **FAILED** — "Order Failed / Failed to process order" |
| 4 | Hawaiian | Small | **FAILED** — same |

Raw response bodies (via curl, since the UI hides `details`):
- Large Margherita: `{"error":"Failed to process order","orderId":"...","details":"Request failed with status code 503"}` — HTTP 500
- Hawaiian Small:   `{"error":"Failed to process order","orderId":"...","details":"Request failed with status code 403"}` — HTTP 500

So the doc's claim "Possibly a different status code buried in `details`" is right: 503 and 403.

### Problems with the written instructions

1. **The form requires a name; the order table doesn't mention it.** The table has
   columns `#`, `Pizza`, `Size` only. The form has a required "Your Name" field and
   the Order button does nothing useful until it's filled. Trivial, but it's the very
   first interaction of the workshop and it's already incomplete.

2. **"Open the browser's devtools, Network tab, and click the failed request"** — the
   failed request does NOT go to `localhost:8080`. The frontend is served from :8080 but
   POSTs cross-origin to `http://localhost:3000/order` (I see the CORS preflight `OPTIONS
   /order 204` then `POST /order 500`). A participant filtering devtools by the page's own
   host, or expecting a same-origin `/api/...` path, will not immediately find it. Docs
   should say "POST http://localhost:3000/order".

3. **The UI never shows `details`.** The red box shows only "Failed to process order" and
   the order ID. The doc prints the JSON body as though you'd see it; you only get it from
   devtools' response tab or curl. Fine, but the doc should say "the UI hides this — the
   response body is:" rather than implying it's on screen.

4. **The doc says "the same flat `500`".** True, but I only learned the 500 from devtools;
   nothing on screen says 500 either.

5. **Biggest content issue: the "try the log approach anyway" step gives away bug #1
   completely.** `docker compose logs delivery-service | tail -20` prints, in plain English:
   ```
   Searching for nearest driver for a Large pizza...
   0 of 4 drivers can carry a Large pizza
   No drivers available for order PIZZA-...
   ```
   That is not "something suspicious", that is the root cause stated outright, and it is
   two lines from the top of `tail -20`. The section immediately before it claims "That's
   it. That's everything the system is prepared to tell you" — which the very next section
   then disproves. The rhetorical setup ("no amount of reading logs puts it back") is
   undercut by the workshop's own next command.
   The *second* bug is genuinely opaque in logs — kitchen logs "Starting to cook ... Small
   Hawaiian" and then simply stops, no error line at all. That asymmetry is the good teaching
   material; the docs treat both bugs as equally log-invisible and they are not.
   Suggested fix: either drop the Large-pizza log line from delivery-service, or reframe the
   section as "one of these two you *can* find in logs; the other you can't — which is which,
   and would you have known where to look?"

6. **`docker compose logs ... | tail -20` is per-service**, which means the participant
   already has to know which service to look in — the doc even asks that rhetorically. But
   it hands you the answer by naming the two services in the commands. Minor, same theme.

7. `docker compose up` in the doc runs in the foreground; the doc later says "Leave compose
   up" but never tells you to open a second terminal, which you need for the `docker compose
   logs` commands. A first-timer on one terminal will Ctrl-C the app to run the log command.

**What would have stopped a less stubborn participant:** nothing here. Segment 1 works.
---

## Segment 2 — Connect Dash0 (budget 10 min; took ~25 min, and ended blocked)

**What I did:** logged into the provided org (WAD-Workshop, `app.dash0-dev.com`),
found Endpoints and Auth Tokens, created an ingest token, wrote `pizza-app/.env`,
verified `.env` is gitignored. Did **not** install the GitHub connector (out of scope
for this dry run — needs a human to grant OAuth).

### BLOCKER (environment, not docs): ingest rejects a freshly created token

`https://ingress.eu-west-1.aws.dash0-dev.com/v1/traces` returns
`401 {"code":16,"message":"invalid authentication token starting with 'y6N3gJO'"}`
for a token created seconds earlier in this org, using **the exact curl Dash0's own
"Example" panel prints on that settings page** (same host, same `Authorization: Bearer`,
same `Dash0-Dataset: default`). I retried after 60s, tried with and without the `Bearer`
prefix, with and without the dataset header, with an empty and a real span payload.
Always 401. The pre-existing "Auto-generated auth token" is rejected the same way.

So no telemetry can reach this org. Segments 4, 6 and 7 depend on data arriving.
I'll continue through segment 3 (the code change is still real) and record what breaks.

### Docs issues in segment 2

1. **`https://app.dash0.com` is the wrong host for this org.** I was handed
   `app.dash0-dev.com`. Every link in every segment file points at `app.dash0.com`. A
   participant onboarded to a dev/staging org follows the link, lands in a different
   (or empty) org, and spends ten minutes confused. Either the docs should not hardcode
   a host, or the facilitator handout must override it loudly.

2. **"Organization settings → Endpoints → OTLP" — there is no "OTLP" entry.** The
   Endpoints list has **"OTLP via gRPC"** and **"OTLP via HTTP"** as separate items with
   *different values*: `ingress.eu-west-1.aws.dash0-dev.com:4317` (host:port, no scheme)
   vs `https://ingress.eu-west-1.aws.dash0-dev.com` (scheme, no port). The `.env` template
   is a single `DASH0_OTLP_ENDPOINT=<your endpoint>` with no guidance. Whichever the
   participant picks, the agent in segment 3 has to guess the matching exporter
   (`OTLPTraceExporter` from `@opentelemetry/exporter-trace-otlp-grpc` vs `-proto`/`-http`)
   and whether to append `/v1/traces`. This is the single most likely silent-failure
   point in the whole workshop and the docs say nothing. **Fix: pin it — "use OTLP via
   HTTP; the value is the base URL with no path."**

3. **There is no "Organization settings" link in the left sidebar.** I found the page by
   guessing the URL `/settings/endpoints`. From the default Agent0 screen, the nav has
   Home / Dashboards / Integrations / Chat / Automations / … and the settings area is
   behind the small avatar at the bottom-left. Docs should say where to click.

4. **"create one with ingest rights"** — the New Auth Token form's Permissions dropdown
   offers "All permissions (querying, ingesting and configuring)" by default and the help
   text recommends `ingestion-only` for public deployments. There is no option literally
   called "ingest rights". Minor, but the doc's phrasing doesn't match the UI.

5. **No verification step.** The doc's own warning — "sending to the wrong region doesn't
   error, it just silently succeeds into nowhere" — argues loudly for a two-line "check
   your credentials now" curl before you spend 20 minutes on segment 3. The settings page
   literally prints that curl; the workshop doesn't mention it. Had the doc included it I
   would have found this blocker in segment 2 instead of segment 4. **This is my #1
   suggested addition to the whole workshop.**

6. **Dataset guidance is vague.** "The `default` dataset is fine for today" — but the auth
   token form has both a "Dataset" restriction and a separate "Default ingestion dataset"
   field, and OTLP ingest also takes a `Dash0-Dataset` header. Three places a dataset can
   be set and the doc mentions none of them. In a shared-org room ("the host will tell you
   which one is yours") a participant will not know that they must ALSO set the dataset on
   the token or in the exporter headers.

7. **The GitHub connector step is a hard gate and is written as one paragraph.** "Install
   the connector and give it access to **your fork**" — installing a GitHub App is an
   OAuth grant that many corporate GitHub orgs will block pending admin approval. The doc
   says this "is the step that makes the rest of the workshop work" but offers no fallback
   at all for someone whose org denies it. Given segments 3, 5 and 7 all depend on it,
   there should be a documented path (e.g. "if you can't install it, use the fallback
   branches and do segments 4/6 only").

8. `gh repo fork dash0hq/otel-pizza-workshop --remote` assumes `gh` is installed and
   authenticated; that's not in the prerequisites list.

**Would have stopped a less stubborn participant:** yes, twice — the gRPC/HTTP endpoint
ambiguity, and the 401. Neither has a troubleshooting entry (checked below).

### troubleshooting.md vs. what actually went wrong

- "No traces in Dash0 → 4. Auth token. A 401 or 403 in the collector logs. Check the token
  has ingest rights" — my token has *all* permissions and still 401s. The entry assumes the
  only cause of 401 is a scope mistake. No entry covers "ingest rejects a valid token".
- The whole "No traces in Dash0" section assumes an **otel-collector container exists**
  (`docker compose logs otel-collector`). Nothing in segments 1-3 tells the participant a
  collector is expected — that's a design decision the agent makes in segment 3, and if the
  agent chose direct OTLP export instead, step 2 of the troubleshooting is meaningless.
- "I'm behind": `git fetch origin && git branch -r` — if you cloned *your fork* as the docs
  told you to, `origin` is your fork and the fallback branches aren't there. Contradicts
  the setup instructions.
---

## Segment 3 — Let Agent0 instrument it (budget 20 min; BLOCKED at ~5 min)

**What I did:** opened a new Agent0 thread in the Dash0 app (as the doc insists — "this
step writes code, so it can't be MCP"), pasted Prompt 1, submitted.

### BLOCKER: Agent0 in the app fails immediately

The thread renders my prompt and then a red box:

```
Fatal Error
Error: Fatal Error at k (.../2ygxkd27o44b2.js:1:3814) ...
Trace ID: d0420000247cb1cd80dd41f80eb3fdee
```

and the chat list shows:

```
Failed to load recent chats
Received unexpected status code 421 when calling
POST https://api.eu-west-1.aws.dash0-dev.com/api/agents/agent0-sdk/threads?dataset=default
```

HTTP **421 Misdirected Request** on the org's own API host. Clicking Retry reproduces it.
This looks like the same root cause as the ingest 401: the WAD-Workshop org is being
addressed at `*.eu-west-1.aws.dash0-dev.com` and that cluster does not own it. Screenshots
07 and 08.

### Second environment problem: the MCP connection points at a different organisation

The docs' "Optional: MCP from your editor" path is available to me, but
`listDatasets` over MCP returns 13 datasets (OTel Demo, Dash0 Insights, iac-tests, …) and
every deep link comes back as `https://app.dash0.com/goto/...&org=dash0-development` —
i.e. **production Dash0, org `dash0-development`**, not the `WAD-Workshop` org on
`app.dash0-dev.com` I was told to use. Agent0 over MCP does respond (a `runTask` started
fine), it just cannot see the workshop's data.

Docs gap this exposes: segment 2 says "connect the MCP endpoint (Organization settings →
Endpoints → MCP)" in one sentence and never says that the MCP endpoint is **per
organisation**, or how to tell which org an already-configured MCP client is pointed at.
In segment 5 the doc suggests "ask the same question from both places" — if the two places
are different orgs you get two different answers and no way to notice.

### Docs issues in segment 3 (from reading + the little I could execute)

1. **Prompt 1 never names the repository.** It opens "This repository is a pizza-ordering
   app…" — but Agent0 is in a browser tab, not a checkout. Nothing in the prompt or the
   segment tells it *which* repo, and if the GitHub connector has more than one repo (or
   you forked it under a different name, as the dry-run fork is:
   `otel-pizza-workshop-dryrun`) it has to guess. The prompt should carry
   `owner/repo` explicitly.

2. **Prompt 1 says "the existing .env file".** `.env` is gitignored, so it is *not* in the
   repo Agent0 can read. Agent0 can only be told "reference `${DASH0_AUTH_TOKEN}`"; it
   cannot see the file to learn the endpoint value. The endpoint therefore has to be
   supplied in the prompt, or the agent will invent one — and per segment 2 the wrong
   endpoint fails silently. **This is a concrete, likely failure and the prompt as written
   sets it up.**

3. **Review checklist item 4 ("Does the collector actually route to Dash0? An exporter
   block that points at `localhost:4317` with no auth header is a pipeline to nowhere")
   is good** — but it's exactly the failure item 2 makes likely, and the doc doesn't
   connect them.

4. **"Pull and rebuild: `git pull`"** — from `pizza-app/`? From the repo root? And `git
   pull` with no branch argument after merging a PR on GitHub only works if you're on
   `main` and tracking. A participant who is on a feature branch gets nothing and no error.

5. **"a trace with roughly six spans"** is a good, checkable success criterion. Keep it.

6. **The fallback is `origin/solution`** — first time a branch name appears anywhere. The
   README promised fallbacks but only this segment names one. And again: if `origin` is
   your fork, `origin/solution` does not exist unless GitHub's fork copied it and you
   fetched. Worth one extra line: `git fetch upstream && git checkout -b my-instrumentation
   upstream/solution`.

7. **"Stuck at minute 18?"** — the segment budget is 20 minutes and the doc expects the
   agent to have written, you to have reviewed, and you to have merged a multi-file PR in
   that window. From what I saw of how long a single Agent0 turn takes, 20 minutes is
   optimistic for the ask + review + merge + rebuild + traffic + find-the-trace sequence.
---

## CRITICAL FINDING — none of the fallback branches exist

The README's central safety net is: "Every segment that depends on agent output has a
fallback branch you can check out in thirty seconds to rejoin the group."

`dash0hq/otel-pizza-workshop` (the `origin` of this checkout, and the repo the README
tells participants to fork) has **exactly one branch: `main`**.

```
$ git ls-remote --heads origin | wc -l
1
$ git ls-remote --heads origin solution       -> 0 refs
$ git ls-remote --heads origin fix-1-pineapple -> 0 refs
$ git ls-remote --heads origin fix-2-size-rank -> 0 refs
```

All three branches named in the participant docs are missing:
- `03-instrument.md`: `git checkout -b my-instrumentation origin/solution`
- `05-troubleshoot.md`: `git log --oneline origin/fix-1-pineapple origin/fix-2-size-rank`

So every participant whose agent goes sideways — which the README itself predicts will
happen to several people in a room of twenty-five — has no recovery path, and the command
they're given fails with `fatal: ... unknown revision`. **This is the single highest-impact
defect I found.** (Either the branches need pushing, or the docs need to stop promising
them.)

### Related: the docs spoil their own puzzle

`05-troubleshoot.md` line 99 prints the branch names **`fix-1-pineapple`** and
**`fix-2-size-rank`** in the participant-facing guide. Those two names give away both root
causes — pineapple/Hawaiian handling, and a size ranking/ordering problem — before the
participant has asked Agent0 anything. Segment 5 is the climax of the workshop and its
answer key is printed in it. Rename them (`fallback-fix-a` / `fallback-fix-b`) or move the
list to the facilitator guide and have the host hand it out.

---

## Segments 4-7 — could not execute (no telemetry). Review of the text only.

I could not run these: no data ever reached Dash0 (ingest 401) and Agent0 in the app
fatal-errors (421). Below is what a careful read turns up.

### Segment 4 — Find your way around

- **No navigation instructions at all.** "Open any successful order trace." Where? The
  sidebar has Tracing, Services, Resources, Query Data… A first-time Dash0 user does not
  know that traces live under Telemetry → Tracing, or how to switch dataset, or how to set
  the time range. Every other segment at least names a menu path; this one names none, and
  it's the segment where the participant is newest to the product.
- "Filter the trace list for errors" — no indication of how (a filter chip? `otel.status_code
  is ERROR`? a saved view?).
- The content itself (client vs server spans, resource vs span attributes, "nobody wrote
  the propagation") is the best-written material in the workshop. The gap is purely
  "where do I click".
- "The host drives this segment from the front" partly excuses that — but the docs are
  also the take-home artifact, and a participant re-reading them later cannot follow this.

### Segment 5 — Let Agent0 troubleshoot

- The judge-the-answer framing (trace IDs, failure-rate match, one-more-why) is genuinely
  the most valuable page here. No complaints.
- "continue the thread **in the Dash0 app**" — if the participant ran Prompt 2 over MCP,
  the docs never say *how* to find that same thread in the app. There is a thread URL, but
  nothing tells you to keep it. One sentence would fix it.
- Prompt 2 says "the last [30 minutes]" in brackets; the surrounding docs don't say to
  widen it if you've been slow. A participant who spent 40 minutes on segment 3 will hand
  Agent0 a window with no failures in it.
- `git pull` again with no directory or branch context.

### Segment 6 — Alert on it

- Strongest pedagogy in the set (the "alert on any error" vs "50%" framing, the window
  argument, "if you can't explain to on-call why this woke them"). Keep as is.
- But it never says *where* check rules live in the Dash0 UI, or that Prompt 4's "Before
  creating it, tell me whether this rule would have fired" requires historical data — which
  only exists if segment 3 worked and enough time has passed.
- "Only about [a third] of requests were failing" (Prompt 4) — with the documented 4-order
  script the real rate is 2/4 = 50%, and under segment 7's load loop (Hawaiian + Large) it
  is 100%. The bracketed "a third" will be wrong for most participants, and segment 6's
  own prose says "you'd never have caught today's bug" at a 50% threshold. The doc and the
  prompt disagree about the failure rate.

### Segment 7 — Close the loop

- Depends on: telemetry flowing, GitHub connector installed, a check rule existing, and
  Automations. Four gates, any of which strands you. The doc acknowledges this ("the most
  moving parts") and gives a good fallback (watch the host). Good.
- `git revert --no-edit <sha>` then **`git push`** — this pushes straight to `main` on the
  participant's fork, after a whole workshop of PR discipline. If their fork has branch
  protection it fails. Say "push to a branch" or note that main must be writable.
- The load loop orders `Hawaiian` + `Large` — that is *both* bugs at once, so the error
  rate is 100%, not the "about a third" the check rule in segment 6 was tuned for. If the
  participant followed Prompt 4 literally they may have a threshold that this traffic
  trivially exceeds, which undercuts the "would it have fired on the real bug?" lesson.
- Useful confirmation of my segment-1 point: this segment correctly documents the endpoint
  as `http://localhost:3000/order`. Segment 1 should do the same.

---

## Summary of where I got to

- Segment 1: **completed**, worked, both documented failures reproduced.
- Segment 2: **completed the documented steps**, but ended blocked — ingest returns 401
  for a freshly minted token using Dash0's own example request.
- Segment 3: **blocked immediately** — Agent0 in the app returns a Fatal Error (HTTP 421
  from `api.eu-west-1.aws.dash0-dev.com`). No PR, no instrumentation.
- Segments 4-7: **not executable** (no telemetry, no Agent0). Reviewed as text.
- GitHub connector: **not installed** — out of scope for this dry run (OAuth grant needs a
  human). Dash0 shows "GitHub — missing configuration".

Elapsed: roughly 55 minutes against a documented budget of 40 for segments 1-3.
---

## ROOT CAUSE of both blockers — organization region mismatch (confirmed by the server)

Follow-up investigation. The hypothesis was right: it is a cross-region problem, but
**not** in the auth token or the JWT — the org record itself points at a region that does
not exist in the dev environment.

### The smoking gun

`POST https://api.eu-west-1.aws.dash0-dev.com/api/agents/agent0-sdk/threads?dataset=default`
with the org's own auth token returns:

```json
{"error":"organization_region_mismatch",
 "error_description":"This organization is served from region 'aws-us-west-2', not
   'aws-eu-west-1'. Re-issue the request against the organization's home region.",
 "expected_region":"aws-us-west-2",
 "actual_region":"aws-eu-west-1"}
```

The browser only ever surfaced this as a generic `Fatal Error` box plus HTTP **421
Misdirected Request**. The actual explanation is only visible in the response body.

### Auth state — the JWT carries no region at all

Clerk session token claims (decoded in-page via `Clerk.session.getToken()`):

| claim | value |
|---|---|
| `iss` | `https://included-camel-2.clerk.accounts.dev` |
| `azp` | `https://app.dash0-dev.com` |
| `org_id` | `org_3JWAPdAUPERrE7bqxjlNilbcke7` |
| `org_slug` | `5a3f301a-54ab-4808-9735-0bd5392e83a0` (the UUID in the URL) |
| `org_role` | `admin` |
| `sub` / `primary_email` | `user_2vPAa…` / `raphael.manke@dash0.com` |
| region | **absent — no region claim of any kind** |

`Clerk.organization` → `{name: "WAD-Workshop", slug: 5a3f301a-…}`. Clerk environment type
is `development`. So the user's auth is fine and region-agnostic; region is resolved
server-side from the org record, and that record says `aws-us-west-2`.

### Which planes work and which don't (all against the same token)

| Target | Result |
|---|---|
| `api.eu-west-1.aws.dash0-dev.com/api/dashboards` | **200** (returns `[]`) |
| `api.eu-west-1.aws.dash0-dev.com/api/dashboards?dataset=default` | **200** |
| `api.eu-west-1.aws.dash0-dev.com/api/agents` | **421** |
| `api.eu-west-1.aws.dash0-dev.com/api/agents/agent0-sdk/threads` | **421** + `organization_region_mismatch` |
| `ingress.eu-west-1.aws.dash0-dev.com/v1/traces` | **401** `invalid authentication token starting with 'y6N3gJO'` |
| `eum-forwarder.eu-west-1.aws.dash0-dev.com/v1/traces` (Dash0's own RUM) | **200** — the dev cell itself is healthy |

Both the new `pizza-workshop-dryrun` token and the pre-existing auto-generated token behave
identically: valid on the control-plane API, rejected by ingress. So **the token is not the
problem** — the eu-west-1 ingest plane simply has no record of an org whose home region is
us-west-2, and reports that as a flat 401 instead of a region error.

### The org's home region does not exist in dev

```
ingress.eu-west-1.aws.dash0-dev.com   -> 54.155.56.246
api.eu-west-1.aws.dash0-dev.com       -> 54.155.56.246   (same host)
api.us-west-2.aws.dash0-dev.com       -> NXDOMAIN
ingress.us-west-2.aws.dash0-dev.com   -> NXDOMAIN
us-west-2.aws.dash0-dev.com           -> NXDOMAIN
api.us-west-2.aws.dash0.com           -> 35.160.215.182  (PRODUCTION only)
ingress.us-west-2.aws.dash0.com       -> 35.160.215.182  (PRODUCTION only)
```

eu-west-1 is the **only** region that exists in `dash0-dev.com`. `us-west-2` exists only in
production. So the WAD-Workshop org was created with `home_region = aws-us-west-2` in an
environment that has no such cell — it is unroutable by construction. Nothing a participant
could configure would fix it; the org record has to be changed (or the org recreated in
eu-west-1).

### Consequences for the workshop

- Every "region" warning in the docs is aimed at the participant picking the wrong endpoint.
  Here the participant picks the **only** endpoint the UI offers, and it is still wrong,
  because the settings page renders the cell it is being served from rather than the org's
  home region. `02-connect-dash0.md`'s advice — "check the endpoint host against
  Organization settings → Endpoints" — cannot detect this failure mode, and neither can
  `troubleshooting.md` item 1.
- `troubleshooting.md` item 4 ("A 401 … check the token has ingest rights") actively
  misleads here: the token has all permissions and is provably valid on the API.
- **Facilitator action before the real workshop:** verify each org's home region matches the
  environment, and add a pre-flight ingest curl to segment 2 so this surfaces in minute 10
  rather than minute 45.
