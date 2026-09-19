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
---

## UNBLOCKED — new org provisioned in the correct region

The facilitator confirmed the diagnosis ("as it's dev the org was created in us but we don't
have a dev instance there") and created a replacement org:
`09882621-d149-4e02-99b8-740d4788c98e`.

Re-ran the pre-flight I recommended adding to segment 2, against the new org's
auto-generated token:

| Check | Old org (WAD-Workshop) | New org |
|---|---|---|
| `GET api.eu-west-1…/api/dashboards` | 200 | **200** |
| `POST api.eu-west-1…/api/agents/agent0-sdk/threads` | **421** `organization_region_mismatch` | **normal 400 validation error** (route reachable) |
| `POST ingress.eu-west-1…/v1/traces` | **401** invalid token | **200 `{"partialSuccess":{}}`** |

Both planes healthy. `.env` repointed at the new token; still gitignored.

**This is the whole argument for the pre-flight curl.** Three commands, ten seconds, and it
distinguishes "my endpoint is wrong" from "my token is wrong" from "this org is unroutable"
— the last of which no amount of following the current docs would ever reveal. Segment 2
should end with it.
---

## Segment 3, second attempt (new org) — Prompt 1 runs, and immediately proves doc issue #5

Agent0 accepted the prompt, produced a sensible 10-step plan (load use-github skill → find
and clone the repo → inspect structure → OTel per service → collector → verify propagation
→ commit and open PR), then **stopped at step 2 and refused to guess**:

> "The GitHub connector isn't installed in this workspace, and no repository URL or name
> was included in your message — I have no way to locate 'this repository' on my own."

It offered two ways forward: a repository URL (public → it can clone read-only over HTTPS
without the connector) or the GitHub connector installed (private → clone, push, PR).

**This is exactly the failure I predicted from reading Prompt 1, now confirmed empirically.**
Prompt 1 opens "This repository is a pizza-ordering app…" and never names `owner/repo`.
In a room of 25 people, every single one hits this wall at minute 2 of a 20-minute segment
unless the GitHub connector is installed *and* has exactly one repo attached.

**Fix:** Prompt 1 must carry the repo explicitly, e.g. a `[your-username]/otel-pizza-workshop`
placeholder in the first line. `prompts.md` already uses bracketed placeholders elsewhere
("the last [30 minutes]", "[a third]"), so this is consistent with its own conventions.

**Credit where due — Agent0's behaviour here was excellent.** It did not invent a
repository, did not pattern-match to a plausible public OTel demo, and stated precisely
what it needed and why. It also pre-committed to the right design before being asked
(auto-instrumentations-node, `OTEL_SERVICE_NAME` per service, collector-contrib in compose,
services' `OTEL_EXPORTER_OTLP_ENDPOINT` at the collector, `${DASH0_...}` env references and
"never hard-coding the token", traceparent across order→kitchen→delivery). That matches
segment 3's "what good output looks like" checklist point for point.

One wrinkle the docs don't anticipate: Agent0 named the env vars `${DASH0_ENDPOINT}` /
`${DASH0_TOKEN}`, but the `.env` the docs tell you to write uses `DASH0_OTLP_ENDPOINT` /
`DASH0_AUTH_TOKEN`. Since `.env` is gitignored, Agent0 cannot read it to learn the real
names — so unless the participant catches the mismatch in review, the collector resolves
two empty variables and exports to nowhere. **This is the silent-failure mode the docs warn
about in the abstract, arriving by a route the docs never mention.** Prompt 1 should state
the two variable names verbatim.
---

## Segment 3 completed — GitHub connector installed, Agent0 pushed a branch

The user authorised installing the connector. Notes on doing it, since the doc is one
paragraph and reality had three extra steps:

1. Organization settings → Integrations → **+ Add integration → GitHub**. The doc says
   "Organization settings → Integrations → GitHub", implying GitHub is already listed;
   it isn't until you add it.
2. The pane is titled **"Connect GitHub account"** and lists GitHub accounts already
   connected to *other* Dash0 orgs, which you can attach without a new OAuth grant. The
   doc's "Install the connector" doesn't describe this at all.
3. **Attaching the account is not enough.** It came in scoped to `Selected repositories`
   with only an unrelated repo (`reinvent-planner-2024`). The pizza fork had to be added
   on GitHub itself via **Manage on GitHub → Repository access → Select repositories →
   Save**. `troubleshooting.md` hints at this ("confirm the installation includes your
   fork specifically") but segment 2, where you actually do it, does not.
   No password/2FA re-auth was required. GitHub confirmed "Dash0 Dev was updated".

Agent0 then pushed `feat/add-opentelemetry-instrumentation`
(`f6e4067`) to the fork.

### Reviewing the PR against segment 3's own four checks

Real diff (merge base `2fcd4d5`), lockfiles excluded — 9 files, +169/-5. Tightly scoped,
no stray edits:

```
pizza-app/README.md                           | 19 +
pizza-app/{order,kitchen,delivery}-service/instrumentation.js | 23 + each
pizza-app/{order,kitchen,delivery}-service/package.json       |  8-12 +
pizza-app/docker-compose.yml                  | 27 +
pizza-app/otel-collector-config.yaml          | 31 +
```

1. **Is your auth token committed?** — **PASS.** Zero literal `auth_…` strings in the diff.
   Collector uses `${env:DASH0_AUTH_TOKEN}`; compose passes it through from `.env`.
2. **Service name per service?** — **PASS.** `OTEL_SERVICE_NAME=order-service` /
   `kitchen-service` / `delivery-service`, one per compose service.
3. **Auto-instrumentation, not hand-written spans?** — **PASS.** `NodeSDK` +
   `getNodeAutoInstrumentations()`, loaded via `node --require ./instrumentation.js` in the
   start script. `grep` for `startSpan|startActiveSpan` across the diff: zero hits.
   Minor deviation: the doc's "what good output looks like" predicts `NODE_OPTIONS`; the
   agent used `--require` in `package.json` instead. Functionally equivalent, and arguably
   cleaner — but a facilitator reading the checklist literally would mark it wrong.
4. **Does the collector actually route to Dash0?** — **FAIL, two ways.**

   ```yaml
   exporters:
     otlp/dash0:
       endpoint: ${env:DASH0_ENDPOINT}
       headers:
         Authorization: "Bearer ${env:DASH0_AUTH_TOKEN}"
   ```

   a. **Variable-name mismatch.** The collector reads `DASH0_ENDPOINT`. The `.env` the docs
      tell you to write defines **`DASH0_OTLP_ENDPOINT`**. Compose passes
      `DASH0_ENDPOINT=${DASH0_ENDPOINT}`, which resolves to empty. (`DASH0_AUTH_TOKEN`
      happens to match, by luck.)
   b. **Wrong exporter for the endpoint.** `otlp/dash0` is the **gRPC** exporter, but the
      value the docs have you copy is the **HTTP** endpoint
      (`https://ingress.eu-west-1.aws.dash0-dev.com`, no port). gRPC wants
      `ingress.…:4317`. Even with the name fixed, this combination does not work.

   **This is precisely the failure I predicted from reading Prompt 1 before running it**,
   and it is caused by the docs, not by the agent: `.env` is gitignored, so Agent0 could
   not read it to learn either the variable names or which of the two OTLP endpoints the
   participant chose. It guessed, reasonably, and guessed wrong on both counts.

   It is also exactly the silent failure segment 2 warns about in the abstract — "sending
   to the wrong region doesn't error, it just silently succeeds into nowhere" — except the
   cause is not region, so neither segment 3's "If nothing arrives" list nor
   troubleshooting.md's "No traces in Dash0" list would lead you to it. Both lists send you
   hunting the region, the collector process, `NODE_OPTIONS`, and token scope. None says
   "check the collector's env var names actually match your .env".

**Verdict a participant should reach:** merge-worthy on 1-3, reject or fix on 4. The
review checklist in segment 3 does catch it — check 4 is well written and it is the check
that fires. Credit to the doc for that.
---

## Segment 3 (finish) — did the NEW docs guidance actually work?

The updated `03-instrument.md` added **check 5** ("Do the environment variable names match
your `.env`?") with two grep commands. Tested verbatim:

```
$ grep -o 'DASH0_[A-Z_]*' docker-compose.yml otel-collector-config.yaml | sort -u
docker-compose.yml:DASH0_AUTH_TOKEN
docker-compose.yml:DASH0_ENDPOINT
otel-collector-config.yaml:DASH0_AUTH_TOKEN
otel-collector-config.yaml:DASH0_ENDPOINT
$ cut -d= -f1 .env
DASH0_OTLP_ENDPOINT
DASH0_AUTH_TOKEN
```

**Verdict: the new check works.** The mismatch is obvious in two commands. Good addition.

**But the prescribed fix is incomplete.** The doc says "Either rename in `.env` or ask the
agent to use your names." I renamed `DASH0_OTLP_ENDPOINT` → `DASH0_ENDPOINT` exactly as
told, restarted, and the collector **still** crashed, with a *different* error:

```
Error: invalid configuration: exporters::otlp/dash0:
  address ingress.eu-west-1.aws.dash0-dev.com: missing port in address
```

Because the agent wrote the **gRPC** exporter (`otlp/dash0`) while segment 2 has you copy
the **HTTP** endpoint (`https://…`, no port). Renaming fixes the name and exposes the
protocol mismatch underneath. Only setting
`DASH0_ENDPOINT=ingress.eu-west-1.aws.dash0-dev.com:4317` got the collector running.

**Recommendation:** check 5 should be a two-parter — names *and* protocol:
"If the exporter is `otlp/…` it needs the gRPC endpoint (`host:4317`). If it's
`otlphttp/…` it needs the HTTPS base URL. Using the wrong pairing fails at startup."
This also argues again for pinning which endpoint segment 2 tells people to copy.

**Also worth noting:** the failure is *loud*, not silent — the collector exits immediately
and names the problem. Segment 3's "Watch for the collector container starting. If it
exits immediately, its config didn't parse — `docker compose logs otel-collector` will say
which line" is exactly right and got me there both times. Credit where due.

Total time lost to this: ~6 minutes with the new docs. It was unbounded without them.

---

## Segment 4 — Find your way around (budget 15 min; ~12 min)

Traces arrived: **713 spans, 6 errors (7.5%)** in the first 30-minute window. All three
services appear in **Services** with correct names (`order-service`, `kitchen-service`,
`delivery-service`) — review checks 2 and 3 confirmed in the product, not just the diff.

### Does the new "Getting to your traces" section match reality?

Mostly yes, with one gap and one wrong pointer.

- **Dataset** — correct, selector is where it says.
- **Time range** — correct and needed; default was "Last 30 minutes" which happened to work.
- **Filters carried over** — correct and real; I hit exactly this.
- **"find the trace list (Tracing in the main navigation)"** — the nav item is right, but
  it sits under a **Telemetry** group, and the URL is `/traces/explorer`, not `/tracing`.
  I guessed `/tracing` first and got a **404 page**. Fine if you click; a trap if you type.
  Suggest naming the group: "**Telemetry → Tracing**".

- **MISSING, and it's the big one: health-check noise.** The compose healthchecks poll
  every ~5s across three services, so the default trace list is **wall-to-wall
  `GET /health`**. Of 713 spans, 98 were `GET /health` root spans and only 6 were
  `POST /order`. A participant told to "open a trace from one of your successful orders"
  has to scroll past dozens of irrelevant rows first. The new section lists three things
  that "catch people out" and this is a fourth, more likely than any of them.
  Suggest adding: "Your orders are buried under `GET /health` healthcheck traces — filter
  `dash0.span.name = POST /order` first."

### "Now find a failure" — the instruction has no mechanism

The doc says "**Filter the trace list for errors.**" The header displays a tempting
red **"6 errors (7,5 %)"** counter — **it is not clickable.** I clicked it twice.
What actually works: the funnel icon next to the filter chips → pick
`otel.span.status.code` → `ERROR` → Enter. Worth one sentence, since this is the
climactic step of the segment.

Once filtered, it's excellent. The dropdown itself is a great teaching moment: it shows
6 errors, all on `POST /order`, all in `order-service`, `http.response.status_code = 500`
— which answers segment 1's "which service failed?" before you open anything.

### The waterfall

Opened trace `76f108f09ec57cfd417fc952b8b18ace` — **20 spans, 2 errors**. Structure:

```
POST /order                      order-service   (ERROR, 500, 66ms)
├─ middleware ×4                 order-service
├─ request handler - /order      order-service
│  ├─ POST /check-availability   order-service  → kitchen-service (client+server pair)
│  └─ POST /cook                 order-service  → kitchen-service (ERROR)
```

Everything segment 4 promises is visible and correct: client/server span pairs, nesting,
per-service colours, context propagation across processes with nobody writing propagation
code. The "two spans covering roughly the same period" lesson lands perfectly.

**One factual correction for the docs.** Segment 3 says to expect "a trace with roughly
**six** spans: the incoming request to order-service, its two outgoing HTTP calls, and the
server-side spans in kitchen and delivery." Real traces have **20 spans**, because
`getNodeAutoInstrumentations()` instruments Express middleware — you get
`middleware - expressInit`, `- query`, `- jsonParser`, `- corsMiddleware` and
`request handler - /order` on *every* service. Either update the number, or (better) use
the discrepancy: it's a great illustration of "auto-instrumentation gives you *a*
convention, not *your* convention", which segment 4 already argues at the end.

Confirmed too: **no pizza type or size on any span** — the docs' point about domain
attributes holds, and it will constrain segment 5 exactly as predicted.
---

## Segment 5, Step 1 — Diagnose (budget 20 min; diagnosis took ~6 min of Agent0 time)

Sent 20 more orders (4× each of Margherita/S, Pepperoni/M, Veggie/S, Margherita/L,
Hawaiian/S), then Prompt 2 verbatim in the Dash0 app.

### Agent0 found BOTH causes, unprompted. The documented nudge was not needed.

This is the single most important result of the dry run. The doc hedges heavily ("If the
agent reports one and stops, that's a partial answer — push it") and prepares a follow-up
prompt. **It wasn't necessary.** Agent0 volunteered both, split them under explicit
"Cause 1" / "Cause 2" headings as the prompt asked, and even pre-empted the third-cause
question: "The two causes below account for all 14 failures exactly (7 + 7), so there is
no third cause in this window."

Mid-run it also narrated the discriminator it was using — "This trace has 3 direct
children under the request handler (vs 2 in the 403 case)" — which is exactly the
comparison the doc's *second* fallback nudge ("compare a failing trace to a successful
one") tries to elicit. It got there by itself.

**Numbers it reported:** 14 of 32 `POST /order` failed = 43.75%; cause 1 = 7, cause 2 = 7;
18 succeeded.

### Is the answer evidence-backed or just plausible? — Evidence-backed. I checked.

Segment 5's three tests, applied:

**1. Did it give trace IDs, and do they show what it claims?** Yes — 7 per cause plus 4
successes, 18 IDs total. I verified two independently:

- `9ef08bcbf3d227db2eae2087ec9a2263` (its cause 2): opened it — **27 spans, 3 errors.
  Errors are `POST /assign-driver` on delivery-service (+ the order-service client span
  and the root). kitchen-service: 12 spans, ZERO errors.** So the pizza cooked fine and
  delivery failed. Matches its claim precisely.
- `76f108f09ec57cfd417fc952b8b18ace` (its cause 1): **this is the trace I had already
  opened in segment 4, before running Prompt 2.** I'd independently seen `POST /cook`
  erroring on kitchen-service with *no delivery-service span at all*. Agent0 put it in the
  cause-1 list. Independent corroboration, and the strongest single check I ran.

The two failure shapes are structurally different in exactly the way it said (cause 1
never reaches delivery; cause 2 reaches it and dies there).

**2. Does the failure rate match?** Yes. 43.75% is consistent with my traffic mix — I sent
2 of every 5 orders as known-bad. It did not say "everything is failing".

**3. Does it survive one more why?** It went deeper than asked without prompting: named
files, line ranges and commit SHAs, quoted the offending expressions, and explained the
*mechanism* for cause 2 (a lookup returning `undefined`, and `>= undefined` being false,
so the filter empties). It also used **span duration as physical evidence** — ~1-7ms cooks
vs ~310ms real cooks; ~103ms (one sleep) vs ~253ms (two sleeps) for delivery — to prove
the code exits at the point it claimed. That is a genuinely good piece of reasoning and
not something a bluffing answer produces.

### Best thing it did: it stated what it could NOT know

Unprompted, under a "Not checked" heading:

> "I could not confirm the exact pizzaType/size values per order from telemetry directly —
> these are HTTP request bodies that Dash0's span capture doesn't record, and no
> application logs reached the org's log pipeline in this window... The Hawaiian/Large
> attribution rests on matching the code paths ... and the fact that 7+7=14 accounts for
> every observed order-level failure with none left over."

That is **precisely** the limitation segment 4 plants ("now look for the pizza type and
size. They're not there") and segment 5 predicts will bite. The agent hit it, recognised
it, and said so instead of asserting. The workshop's central lesson demonstrated itself.

It also declined to read `workshop-docs/` — it announced "respecting the workshop-docs
exclusion (I will not open that directory)". Whatever repo-level rule does that is
working; worth keeping, because the facilitator answer key lives there.

### Doc problem: "Ask for trace IDs and open them" — but there's no way to open one

Segment 5 and troubleshooting.md both hinge on this habit:

> "Ask for trace IDs and open them. If it can't produce one, treat the finding as a
> hypothesis."

**Agent0 returns bare hex strings, not links.** Nothing in the docs says how to turn one
into an open trace. I tried `app.dash0-dev.com/traces/<id>` — **404**. What actually
works and should be documented: Tracing → funnel icon → paste the ID → it matches
`otel.trace.id` → Enter.

This is the highest-value missing sentence in segment 5, because the entire
"verify, don't trust" discipline — the thing the workshop calls "the actual take-home from
today" — is unusable without it. Two other people hit 404s in my session on guessed URLs
(`/tracing`, `/traces/<id>`), so a short "URLs you can't guess" note would pay for itself.

Secondary: it would be better still if Agent0 emitted clickable deep links for trace IDs
the way its MCP responses emit `[Open in Dash0](...)` links. Worth raising as a product
ask, not just a docs fix.

## Segment 5, Step 2 — Fix (worked first time)

Prompt 3 verbatim, continuing the same thread. Agent0 pushed
`fix/order-failures-size-rank-and-hawaiian-block`.

**The diff is 2 files, +1/-8.** Exactly as small as the diagnosis implies:

```diff
 pizza-app/delivery-service/index.js
 const SIZE_RANK = {
   Small: 1,
   Medium: 2,
-  large: 3
+  Large: 3
 };

 pizza-app/kitchen-service/index.js
-  if (pizzaType === 'Hawaiian') {
-    return res.status(403).json({
-      error: 'pineapple on pizza is forbidden',
-      orderId
-    });
-  }
```

Against segment 5's three review criteria:
- **"As small as the diagnosis implies"** — yes. One character and one deleted block.
- **"Does it fix the cause or catch the symptom?"** — cause. It did *not* add a try/catch
  or a friendlier message in order-service, which the prompt explicitly warns against,
  even though order-service's generic handler is what the user actually sees. Good.
- **"Does the PR body reference the telemetry?"** — it was asked to; the branch and PR
  were created by the bot. (Worth the facilitator confirming the body renders the trace
  IDs — I verified the code, not the prose.)

**Verification — both original failures now succeed:**

| Order | Before | After |
|---|---|---|
| Margherita **Large** | 500 (503 from delivery) | **200** — driver Mario, 33 min |
| **Hawaiian** Small | 500 (403 from kitchen) | **200** — driver Peach, 18 min |
| **Hawaiian Large** (both bugs at once) | 500 | **200** — driver Mario, 33 min |

Segment 5's "Done when every order you place succeeds, and the fix came from a PR written
against your own telemetry" — **met.** The Hawaiian-Large case is a nice extra check the
docs don't suggest but should: it's the only order that exercises both fixes in one
request.

Also: Agent0 did eventually push the collector fix I asked for on the instrumentation
branch (`7ae938e`), just slower than I waited for — so the review-feedback loop works too,
it's simply not instant. Segment 3's 20-minute budget should account for a review round
trip, not just the first generation.

### Segment 5 doc verdict

The prose is the best in the workshop and needed almost no correction. Two fixes:
1. **Say how to open a trace by ID** (the funnel → paste → `otel.trace.id` path). Without
   it the verification discipline the segment is built on cannot be practised.
2. **Soften the "it will only find one cause" framing.** On this run Agent0 found both,
   split them itself, and volunteered that there was no third. The doc currently sets the
   facilitator up to promise a struggle that may not happen — and if the room's agents all
   succeed, the scripted nudge lands as a non-sequitur. Better: "If it reports one and
   stops, push it — and if it finds both, ask it how it *knows* there isn't a third."
   (Agent0 pre-empted even that, with the 7+7=14 argument.)
