# 7. Close the loop

**20 minutes.** You'll end by watching an alert fire and a draft PR appear
without touching anything.

Everything so far has been you, prompting. This segment removes you from the
first ten minutes of the next incident.

## The idea

You've done it manually already, twice:

1. Something breaks.
2. You ask Agent0 what happened.
3. Agent0 reads the telemetry, finds the cause, opens a PR.

Steps 2 and 3 didn't need you. They needed a *trigger*. You built the trigger
in the last segment.

## Wire it

**Prompt 5** in [prompts.md](prompts.md), in the Dash0 app. Connect your check
rule to an automation that, when it fires, investigates and opens a **draft**
PR.

Draft, not ready-to-merge. The agent's job is to have the work started when
you arrive, not to ship to production while you're asleep. The human stays on
the merge button — that's the whole design, and it's worth saying out loud if
anyone in the room is uneasy about this.

## Break it on purpose

The satisfying part. Undo your fix and watch the machinery run.

Find the fix commit you merged in segment 5:

```bash
git log --oneline -10
```

Revert it, push, and rebuild:

```bash
git revert --no-edit <the-fix-commit-sha>
git push
docker compose up -d --build
```

Now generate enough failing traffic to cross your threshold. Order the pizza
that used to fail, repeatedly — or from a second terminal:

```bash
for i in $(seq 1 30); do
  curl -s -X POST http://localhost:3000/order \
    -H 'Content-Type: application/json' \
    -d '{"customerName":"Loop Test","pizzaType":"Hawaiian","size":"Large"}' \
      > /dev/null
  sleep 1
done
```

Then watch, in order:

1. Error rate climbs in Dash0.
2. Your check rule fires.
3. The automation starts an Agent0 investigation.
4. A draft PR appears on your fork.

## Read what it produced

This is the bit to be critical about, because it's the bit you'd be trusting
at 3am.

- **Did it find the real cause, or restate the alert?** "Error rate is
  elevated on order-service" is not an investigation.
- **Is the PR the same fix you merged in segment 5?** You know the right
  answer — so you can grade it honestly, which you won't be able to do on a
  real incident.
- **How long did it take?** From threshold breach to draft PR. Compare that
  to how long segment 5 took you with a human in the loop.

## Put it back

```bash
git revert --no-edit <the-revert-commit-sha>
git push
docker compose up -d --build
```

Or merge the draft PR the agent just opened, if it's correct — which is a
nicer ending, and a fair test of whether you actually trust it.

## If it doesn't work

This segment has the most moving parts of any in the workshop, and it's the
one most likely to stall. That's fine — **watch the host's loop run instead**,
and take the manual version home:

> When the alert fires, open Agent0 and paste Prompt 2.

That's the same value with a human trigger, and it works today regardless.

## What you should be uneasy about

Worth holding onto as you leave:

- An agent that opens PRs from alerts will sometimes open confident, wrong
  ones. Draft status and a human reviewer are what make that survivable.
- If the automation fires on every blip, you've built a PR spam machine. The
  threshold work in segment 6 is what keeps this useful.
- **The trace ID in the PR body is still how you tell a real finding from a
  fluent one.** Same test as segment 5. It doesn't stop applying just because
  the loop is automated.

---

**Done when** you've watched an alert produce an investigation and a draft PR
— on your own setup, or from the front.

**Back to:** [Overview](README.md)
