# 5. Let Agent0 troubleshoot

**20 minutes.** You'll end having merged a fix that came out of your own
telemetry, and watched the order succeed.

This is the segment the whole thing has been building to. Take it in two
steps, deliberately: **diagnose first, fix second.** You want the chance to
disagree with the finding before any code changes.

## Step 1 — Diagnose

Run this over MCP from your editor, or in the Dash0 app — diagnosis is
read-only either way.

```text
Some of my pizza orders are failing. All the website says is "Failed to
process order", which doesn't tell me anything.

Can you look at the data in Dash0 and work out what's actually going wrong?
Roughly the last 30 minutes.
```

That's the whole prompt. **Don't tell it where to look** — if you point it
at a service you've done the diagnosis yourself, and it will agree with
you whether or not you were right.

## The follow-ups

Ask these in order, as you would of a colleague. The first is the one that
matters:

```text
How do you know? Can you point me at the actual requests you're looking at?
```

```text
Is that everything, or is something else broken too?
```

```text
What couldn't you tell from the data?
```

That last one produced the best answer of the whole dry run — the agent
volunteered a limitation nobody had asked about, and it was real.

And if it's vague about the mechanism:

```text
What's different between an order that works and one that doesn't?
```

## Judge the answer before you accept it

An agent will always give you an answer. Your job is deciding whether it's
*true*. Three tests:

1. **Did it give you a trace ID?** A finding you can click into is evidence. A
   finding stated confidently with no reference is a guess with good grammar.
   Open the trace. Does it show what the agent says it shows?

   **Click through, don't just read.** In the Dash0 app the answer comes
   with the traces embedded as interactive widgets — open them, follow the
   spans, and check the evidence actually says what the prose around it
   claims. That's the whole exercise, and it takes seconds.

   (If you asked over MCP from your editor instead, you'll get bare trace
   IDs. Paste one into the filter on the **Tracing** page — it matches on
   `otel.trace.id`.)

2. **Does the failure rate match?** If the agent says "all orders are
   failing" and two thirds of yours succeeded, it's pattern-matched to
   something generic. Make it be specific about *which* orders fail.

3. **Does the explanation survive one more question?** Ask *why* one level
   deeper than it went. A real finding gets sharper. A plausible one dissolves
   into restating the symptom.

> A finding you can't trace back to a span is a hypothesis, no matter how
> confident the prose is. **This habit is the actual take-home from today.**

## There is more than one thing wrong

Segment 1 gave you **two** distinct failures that look identical from the
browser. If the agent reports one and stops, that's a partial answer — the
second follow-up above is what pushes it.

Note what that question *doesn't* do: it doesn't tell the agent what the
second thing is, or even that there definitely is one. Getting it to
recognise that it has explained *some* of the failures and not all of them
is the most realistic moment in this workshop. Production incidents are
rarely one bug.

## If it's stuck

Ask about what you can see, not about what you suspect — the last
follow-up above, or:

```text
Which part of the system does the failure start in?
```

Notice the limitation from segment 4 biting here: **the spans don't carry the
pizza type or size.** The agent can see *that* a request failed, not *what was
ordered*. If it struggles to characterise which orders fail, that's not the
agent being dim — it's your instrumentation not carrying your domain. Worth
naming out loud. It's the argument for adding span attributes, which is a
whole other workshop.

## Step 2 — Fix

Once you believe the diagnosis, continue the same thread **in the Dash0
app**:

```text
That matches what I can see. Can you fix it and open a pull request?

I'd rather fix the actual problem than hide the error message. Keep the
change small, and say in the PR how I can check that it worked.
```

Review it on the same terms as segment 3:

- Is the change as small as the diagnosis implies? A one-line cause should
  not produce a two-hundred-line PR.
- Does the PR body reference the telemetry it came from?
- Does it fix the cause, or catch the symptom? An agent that wraps the call in
  a try/catch and returns a friendlier message has hidden the bug, not fixed
  it.

## Merge and verify

```bash
git checkout main
git pull origin main
cd pizza-app
docker compose up -d --build
```

Order the pizzas that failed in segment 1. Both of them.

**If one still fails, that's a result, not a setback** — it means you fixed
one of the two bugs. Go back to step 1 with the failure that remains.

## The fallback

**Ask the host.** Reference fixes exist, but the branch names give away both
root causes, so they're not printed here — reading them would end the
exercise you're in the middle of.

A stuck agent is usually two nudges away, and watching those two nudges work
is worth more than the diff.

---

**Done when** every order you place succeeds, and the fix came from a PR
written against your own telemetry.

**Next:** [6. Alert on it →](06-alert.md)
