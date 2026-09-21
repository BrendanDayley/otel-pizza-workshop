# 6. Alert on it

**25 minutes.** You'll end with a check rule you can defend to someone who
gets woken by it.

You found the bug by ordering four pizzas. That doesn't scale. This segment is
about making the *next* one find you.

## Ask for it

In the Dash0 app:

```text
I only found this because I happened to order a pizza. I don't want to find
out that way next time.

Can you set up an alert that would have caught it? I don't know what a
sensible threshold is — what do you suggest, and would it actually have
gone off while this was broken?
```

You're not telling it what to measure or where to set the line. Both of
those are the conversation you're about to have.

> **Agent0 proposes; you create.** It renders the rule as a preview card in
> the thread with a **Create check rule** button. Nothing exists until you
> click it — and nothing will tell you that you haven't. Argue first, click
> last.

## The threshold argument is the segment

Don't accept the first number the agent proposes. Ask yourself — and each
other — what it should actually be.

Remember what the failure looked like: **only some orders broke.** Which
means your error rate depended entirely on what people happened to order —
in a real system, on traffic mix you don't control. Check what your actual
rate was before the fix rather than guessing. So:

- **"Alert on any error"** — you'll be woken by every dropped connection and
  every bot probing your API. You'll mute it within a week, and then it will
  miss the real one.
- **"Alert at 50% error rate"** — a coin flip here, which is the problem.
  These two bugs happened to push the rate to roughly 40-50%, so 50% might
  have caught it and might not, depending on what the room ordered. A
  threshold that close to your observed rate has no headroom.
- Somewhere between those is a number that depends on things telemetry can't
  tell you: how much traffic you get, how bad a failed pizza order is, and
  who's awake.

Then the part people skip — **over what window?** A 10% error rate sustained
for five minutes is an incident. The same rate for fifteen seconds during a
deploy is Tuesday. A short window catches things faster and cries wolf more
often. Pick one, and be able to say why.

And the question that improves the rule more than any other: **how many
requests does it take before a ratio means anything?** 20% sounds cautious
until it fires on two failures out of ten. A volume gate — "at least N
requests in the window" — is usually the difference between a rule people
keep and a rule people mute. Ask the agent for one; it won't always offer.

**Push back at least twice.** These three each improved the rule in the dry
run — the window went from 5 minutes to 15, a 20-request volume gate
appeared, and a filter that was quietly counting the wrong traffic got
fixed:

```text
How many orders need to happen before that percentage means anything?
```

```text
What happens if it's quiet and two orders fail?
```

```text
Is anything getting counted in that number that shouldn't be?
```

The first answer is never the best one, and accepting it is the most
common way to leave this segment with a worse rule than the person next to
you.

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
