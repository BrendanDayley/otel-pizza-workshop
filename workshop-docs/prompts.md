# Agent0 prompts

Copy these, adjust the bracketed bits, paste. They're starting points — a
better prompt of your own is a better outcome, and worth sharing with the
room.

**Where to run each one:** anything that writes code or changes configuration
runs **in the Dash0 app**, because Agent0 over MCP reads and diagnoses only.
Diagnosis (Prompt 2) works from either.

---

## Prompt 1 — Instrument the app

*Segment 3. In the Dash0 app.*

```
This repository is a pizza-ordering app with three Node.js/Express services
(order-service, kitchen-service, delivery-service) and an nginx frontend, run
with Docker Compose. It has no instrumentation at all.

Add OpenTelemetry to all three Node services and export the telemetry to
Dash0:

- Use OpenTelemetry auto-instrumentation. I don't want manual spans in the
  application code.
- Give each service a correct service.name: order-service, kitchen-service,
  delivery-service.
- Add an OpenTelemetry Collector to docker-compose.yml, and have the services
  export to it.
- Have the collector export to Dash0 using the endpoint and auth token from
  the existing .env file. Reference the environment variables — do not put
  the token value in any committed file.
- Make sure trace context propagates across the HTTP calls between services,
  so one order produces one connected trace.

Open a pull request with the changes, and explain in the PR body what you
added to each service.
```

**What good output looks like:** Dockerfile changes adding
`@opentelemetry/auto-instrumentations-node` and `NODE_OPTIONS`, OTEL env vars
in compose, a new collector config, and `${DASH0_AUTH_TOKEN}` — never the
literal token.

---

## Prompt 2 — Diagnose

*Segment 5. MCP or the Dash0 app.*

```
Some orders in the pizza app are failing. Users see "Failed to process
order" with no further detail.

Using the traces in Dash0 from the last [30 minutes], work out what is
actually going wrong:

- Which service is the failure originating in, and what is it returning?
- Why is it returning that? Read the source in the connected repository.
- Which orders are affected, and which succeed?
- What proportion of requests are failing?

Give me specific trace IDs for the failures you're describing so I can check
them myself. If you find more than one distinct cause, list them separately.
```

**Then push it.** If it reports one cause and stops:

```
That explains some of the failures. Are all of the failing traces explained
by that cause, or is there a second one?
```

If it's vague about the mechanism:

```
Compare a failing trace to a successful one. Which span exists in one and not
the other, and what does its status say?
```

---

## Prompt 3 — Fix it

*Segment 5, after you believe the diagnosis. In the Dash0 app, continuing the
same thread.*

```
That diagnosis matches what I see in the traces. Open a pull request that
fixes the root cause.

- Fix the cause, not the symptom. Don't catch the error and return a nicer
  message.
- Keep the change as small as the diagnosis implies.
- In the PR body, link the trace IDs that show the problem and say how to
  verify the fix.
```

---

## Prompt 4 — Alert on it

*Segment 6. In the Dash0 app.*

```
Create a check rule that would have caught the failure we just fixed.

- Alert on the error rate of order-service, not on individual errors.
- Only about [a third] of requests were failing when the bug was live, so the
  threshold has to be well below that — but high enough not to fire on
  ordinary noise.
- Tell me what threshold and what evaluation window you chose, and why.
- Before creating it, tell me whether this rule would have fired during the
  period when the bug was live, based on the data already in Dash0.
```

Argue with the answer. That argument is the point of the segment.

---

## Prompt 5 — Close the loop

*Segment 7. In the Dash0 app.*

```
Connect the check rule you just created to an automation: when it fires,
investigate the failure using the traces from the alert window, and open a
draft pull request on the connected repository with a proposed fix.

- The PR must be a draft. A human merges.
- The PR body needs the trace IDs the finding is based on, and the measured
  error rate.
- If the investigation can't identify a root cause with evidence, say so in
  the PR instead of guessing.

Walk me through what you've set up before you enable it.
```

---

## Writing your own

The prompts that worked here have four things in common, and they transfer to
any agent against any telemetry:

1. **Say what you observed, not what you concluded.** "Orders are failing with
   a 500" leaves the diagnosis open. "The delivery service is broken" hands
   the agent your assumption and it will usually agree with you.
2. **Demand evidence.** Asking for trace IDs changes the answer, not just its
   presentation — it's harder to produce a confident guess when you have to
   attach a link.
3. **Bound it.** A timeframe and a service narrow the search. Without them
   you get generalities.
4. **Separate diagnosis from action.** Two prompts, not one. It gives you a
   decision point where you can still disagree — which is the only place your
   judgement actually enters the loop.
