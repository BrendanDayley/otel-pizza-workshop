# 5. Let Agent0 troubleshoot

**20 minutes.** You'll end having merged a fix that came out of your own
telemetry, and watched the order succeed.

This is the segment the whole thing has been building to. Take it in two
steps, deliberately: **diagnose first, fix second.** You want the chance to
disagree with the finding before any code changes.

## Step 1 — Diagnose

**Prompt 2** from [prompts.md](prompts.md). You can run this over MCP from
your editor or in the Dash0 app — diagnosis is read-only either way.

You're asking: orders are failing, here's the timeframe, what's actually
happening and why? And critically — **cite the traces**.

## Judge the answer before you accept it

An agent will always give you an answer. Your job is deciding whether it's
*true*. Three tests:

1. **Did it give you a trace ID?** A finding you can click into is evidence. A
   finding stated confidently with no reference is a guess with good grammar.
   Open the trace. Does it show what the agent says it shows?

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
browser. If the agent reports one and stops, that's a partial answer — push
it:

> That explains the Hawaiian orders. What about the Large ones?

Or the other way round, depending on what it found first. Getting the agent to
recognise it has explained *some* of the failures and not all of them is the
most realistic moment in this workshop. Production incidents are rarely one
bug.

## If it's stuck

Nudge with what the telemetry shows rather than with the answer:

> Which service returns the non-200 first, and what does it return?

> Compare a failing trace to a successful one. Which span exists in one and
> not the other?

Notice the limitation from segment 4 biting here: **the spans don't carry the
pizza type or size.** The agent can see *that* a request failed, not *what was
ordered*. If it struggles to characterise which orders fail, that's not the
agent being dim — it's your instrumentation not carrying your domain. Worth
naming out loud. It's the argument for adding span attributes, which is a
whole other workshop.

## Step 2 — Fix

Once you believe the diagnosis: continue the thread **in the Dash0 app** and
use **Prompt 3** to ask for a PR.

Review it on the same terms as segment 3:

- Is the change as small as the diagnosis implies? A one-line cause should
  not produce a two-hundred-line PR.
- Does the PR body reference the telemetry it came from?
- Does it fix the cause, or catch the symptom? An agent that wraps the call in
  a try/catch and returns a friendlier message has hidden the bug, not fixed
  it.

## Merge and verify

```bash
git pull
docker compose up -d --build
```

Order the pizzas that failed in segment 1. Both of them.

**If one still fails, that's a result, not a setback** — it means you fixed
one of the two bugs. Go back to step 1 with the failure that remains.

## The fallback

Reference fixes exist as branches if your agent can't get there:

```bash
git fetch origin
git log --oneline origin/fix-1-pineapple origin/fix-2-size-rank
```

Ask the host before reaching for these — a stuck agent is usually two nudges
away, and watching those two nudges work is more useful than the diff.

---

**Done when** every order you place succeeds, and the fix came from a PR
written against your own telemetry.

**Next:** [6. Alert on it →](06-alert.md)
