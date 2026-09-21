# 4. Find your way around

**15 minutes.** You'll end able to read a trace and find a failing one.

The host drives this segment from the front, but follow along in **your own**
data — your traces, your span names. Where yours differ from the projector,
say so. That's a real finding, not a mistake (more on that at the end).

## Getting to your traces

Before the interesting part, three things that catch people out — check all
three whenever a view looks empty:

1. **Dataset.** The selector is at the top of the screen — `default` is
   where your traces are landing.
2. **Time range.** Defaults are often wider or narrower than you want. Set
   it to the last 15 minutes — you placed those orders a moment ago.
3. **Filters carried over** from the last thing you clicked. An empty list
   with an active filter looks exactly like an empty list with no data.

Then find the trace list (**Tracing** in the main navigation) and open a
trace from one of your successful orders.

## The waterfall

- **Width is time.** The longest bar is where the time went.
- **Nesting is causation.** A child span happened *because of* its parent.
- Each service is a different colour. Notice you can see all three in one
  view — that's the thing you couldn't do with logs in segment 1.

Find the span that took the longest. Is it doing work, or waiting for someone
else to do work? A parent that's wide only because its child is wide isn't
slow — its dependency is.

## Client spans and server spans

Look at the HTTP call from order-service to kitchen-service. You'll see
**two** spans covering roughly the same period:

- a **client** span on order-service — "I sent a request"
- a **server** span on kitchen-service — "I received a request"

The gap between them is network and queueing. When they're wildly different
durations, that gap is your answer.

## Context propagation — nobody wrote this

Here's the thing worth stopping on. **Nobody wrote a single line of
propagation code.** The auto-instrumentation put a `traceparent` header on the
outgoing axios call and read it on the way in. That's why three separate Node
processes produce one connected trace.

That's the whole payoff of a standard: services agree on how to pass context,
so they can be instrumented independently and still compose.

## Attributes — two kinds, and the difference matters

Open a span and look at its attributes.

- **Resource attributes** describe *who emitted it* — service name, version,
  host, container. Same for every span from that service.
- **Span attributes** describe *this one operation* — HTTP method, route,
  status code.

Rule of thumb: if it's the same for every span in the service, it's a
resource attribute. Getting this wrong is the most common instrumentation
mistake — putting a request-specific value on the resource, or a constant on
every span.

**Now look for the pizza type and size.** They're not there. The auto-
instrumentation knows about HTTP; it doesn't know your domain. Remember this
in segment 5 — it constrains what the agent can and can't tell you.

## The service map

See the topology: frontend → order-service → kitchen and delivery. Nobody
drew this. It's inferred from the parent/child relationships in the traces.

On a system you didn't build, this is often the fastest way to understand what
calls what.

## Now find a failure

Back to the trace list, and filter it to errors — either by clicking an
error indicator in the list, or by filtering on the span status. If nothing
comes back, re-check the three things at the top of this page, then place
another failing order and wait a few seconds.

**A failing trace already looks different** — before you've told Dash0
anything about what a failure means in your app. Open one:

- Which span is marked as the error?
- Is it the *deepest* one, or did the error propagate up from a child?
- Compare the error trace to a successful one. Where do they diverge?

You may already be able to answer "which service failed?" — the question
nobody could answer in segment 1. Notice how long that took, versus how long
you spent on it with logs.

**Don't solve it yet.** Segment 5 is where you hand that to the agent. If you
already have a theory, write it down — you'll get to check whether the agent
agrees with you, and which of you is right.

## Your spans differ from the projector's

If your span names don't match your neighbour's, nothing is broken. **A model
chose those names.** Different agents made different calls about naming,
attributes, and where to put the boundaries.

That's the honest trade-off of agent-generated instrumentation: you get it in
twenty minutes instead of a sprint, and you get *a* reasonable convention
rather than *your* convention. Worth knowing before you run this on a real
codebase.

---

**Done when** you can find a failing trace in your own data and say which
service it originated in.

**Next:** [5. Let Agent0 troubleshoot →](05-troubleshoot.md)
