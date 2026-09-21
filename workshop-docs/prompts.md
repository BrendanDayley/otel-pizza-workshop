# Agent0 prompts

**Every prompt here also appears inline in the segment that uses it** — you
don't need this page to follow the workshop. It's the one-pager: all of
them together, for copying ahead of time or for reading on their own.

They're written the way you'd actually ask — plainly, without jargon, and
without telling the agent how to do its job. **That's deliberate.** You're
here to find out what Agent0 works out on its own; a prompt that specifies
the answer only proves you already knew it.

Copy them, change the bracketed bits, paste. Then improve on them — a better
question gets a better outcome, and it's worth sharing with the room.

**Where to run each one:** anything that changes something — code, config, a
check rule — runs **in the Dash0 app**, because Agent0 over MCP reads and
diagnoses only. Asking questions (Prompt 2) works from either.

---

## Prompt 1 — Instrument the app

*Segment 3. In the Dash0 app.*

Name your repository if your fork isn't called `otel-pizza-workshop`.

```
I have a pizza ordering app in this repository — three Node services and a
web frontend, all run with Docker Compose. Right now I can't see anything
about what it's doing when an order comes in.

Can you set it up so I can see what's happening, in Dash0? I have an
account, and my credentials are in pizza-app/.env.

I don't really know OpenTelemetry, so use whatever the sensible defaults
are. If there's a way to do this automatically, without me having to add
tracing code all over the app, I'd much rather have that.

Open a pull request and tell me what you changed.
```

**Then review what comes back** — that's segment 3's actual work. Things the
agent has to guess at, and can get wrong: which environment variable names
you used, whether to hardcode your token, what to call each service. It
can't read `.env`, so it **will** invent the variable names. Catching that
in review is the exercise, not a flaw in the prompt.

---

## Prompt 2 — Diagnose

*Segment 5. MCP or the Dash0 app.*

```
Some of my pizza orders are failing. All the website says is "Failed to
process order", which doesn't tell me anything.

Can you look at the data in Dash0 and work out what's actually going wrong?
Roughly the last [30 minutes].
```

That's the whole prompt. Resist the urge to help it.

### Follow-ups, in the order you'd naturally ask them

**Ask how it knows.** This is the one that matters:

```
How do you know? Can you point me at the actual requests you're looking at?
```

**Ask whether that's the whole story:**

```
Is that everything, or is something else broken too?
```

**Ask what it's unsure about.** In the dry run this produced the best answer
of the session — the agent admitted it couldn't see pizza type or size in
the telemetry, and explained what its conclusion actually rested on instead:

```
What couldn't you tell from the data?
```

**If it's vague about the mechanism:**

```
What's different between an order that works and one that doesn't?
```

---

## Prompt 3 — Fix it

*Segment 5, once you believe the diagnosis. In the Dash0 app, same thread.*

```
That matches what I can see. Can you fix it and open a pull request?

I'd rather fix the actual problem than hide the error message. Keep the
change small, and say in the PR how I can check that it worked.
```

---

## Prompt 4 — Alert on it

*Segment 6. In the Dash0 app.*

```
I only found this because I happened to order a pizza. I don't want to find
out that way next time.

Can you set up an alert that would have caught it? I don't know what a
sensible threshold is — what do you suggest, and would it actually have
gone off while this was broken?
```

**Then argue with it.** The first answer is rarely the best one. These three
questions each improved the rule in the dry run:

```
How many orders need to happen before that percentage means anything?
```

```
What happens if it's quiet and two orders fail?
```

```
Is anything getting counted in that number that shouldn't be?
```

---

## Prompt 5 — Close the loop

*Segment 7. In the Dash0 app.*

```
Can you make it so that when that alert goes off, you look into it and open
a pull request with a fix — without me having to ask?

Keep the PR as a draft. I want to look at it before anything gets merged.
Show me what you've set up before you turn it on.
```

---

## Writing your own

What these have in common, and it transfers to any agent against any
telemetry:

1. **Say what you saw, not what you think it means.** "Orders are failing
   with a 500" leaves the question open. "The delivery service is broken"
   hands over your assumption, and the agent will usually agree with you —
   whether or not you were right.
2. **Don't specify the answer.** If you catch yourself naming the file, the
   function or the fix, you're testing your own diagnosis rather than the
   agent's.
3. **Ask how it knows.** A finding you can click into is evidence. One
   stated confidently with nothing attached is a guess with good grammar,
   and the two read identically.
4. **Ask what it couldn't determine.** Agents will tell you, if you ask.
   It's the fastest way to find the gap in your own instrumentation.
5. **Separate diagnosing from fixing.** Two prompts, not one — that gap is
   the only point in the process where your judgement gets a say.
