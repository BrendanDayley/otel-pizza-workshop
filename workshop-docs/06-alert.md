# 6. Alert on it

**15 minutes.** You'll end with a check rule you can defend to someone who
gets woken by it.

You found the bug by ordering four pizzas. That doesn't scale. This segment is
about making the *next* one find you.

## Ask for it

**Prompt 4** in [prompts.md](prompts.md), in the Dash0 app. You want a check
rule on order-service's error rate — one that would have caught what you just
fixed, and won't fire on noise.

## The threshold argument is the segment

Don't accept the first number the agent proposes. Ask yourself — and each
other — what it should actually be.

Remember what the failure looked like: **most orders succeeded.** Only some
combinations broke. So:

- **"Alert on any error"** — you'll be woken by every dropped connection and
  every bot probing your API. You'll mute it within a week, and then it will
  miss the real one.
- **"Alert at 50% error rate"** — you'd never have caught today's bug. It
  never got near 50%.
- Somewhere between those is a number that depends on things telemetry can't
  tell you: how much traffic you get, how bad a failed pizza order is, and
  who's awake.

Then the part people skip — **over what window?** A 10% error rate sustained
for five minutes is an incident. The same rate for fifteen seconds during a
deploy is Tuesday. A short window catches things faster and cries wolf more
often. Pick one, and be able to say why.

> If you can't explain to an on-call engineer why this rule woke them, it's
> not a good rule. That's the bar, not "it fires when the app is broken."

## Sanity-check it against reality

Your rule should have caught the thing you just fixed. Verify that rather than
assuming it:

- What was the error rate before your fix in segment 5? The data is still in
  Dash0 — look at the window before you merged.
- Would this rule have fired then? If not, it's decorative.
- Is it firing *now*, after the fix? If so, either the fix is incomplete or
  the rule is too sensitive. Both are worth knowing.

## While you're here

Two things worth a minute each, because they're where alerting usually fails
in practice:

- **Where does it notify?** A rule that fires into a channel nobody reads is
  the same as no rule, and it costs more, because now everyone believes
  they're covered.
- **What would a responder need in the notification?** Enough to start
  working: which service, how bad, and a link to the traces. Not just "error
  rate high".

That last point is the setup for the next segment — because if the
notification can carry a link to the traces, it can carry a bit more than
that.

---

**Done when** you have a check rule, you know it would have fired on today's
bug, and you can defend the threshold.

**Next:** [7. Close the loop →](07-close-the-loop.md)
