# OpenTelemetry Pizza Workshop

**Two hours. You will not write a single span by hand.**

You have a pizza-ordering app made of four services. Some orders fail. The
error message tells you nothing useful, and the logs don't either. By the end
of this workshop the app will be instrumented, the bugs will be found and
fixed, and the *next* failure will investigate itself before you've read the
alert.

You direct an agent. The agent does the work. The skill you're practising is
**asking an agent the right question about your own telemetry, and judging
whether its answer is actually true.**

## The path

| | Segment | Time | You'll end up with |
|---|---|---|---|
| 1 | [Run it. Watch it break.](01-run-it.md) | 10 min | A reproducible failure nobody can explain |
| 2 | [Connect Dash0](02-connect-dash0.md) | 10 min | Your fork wired to Dash0 |
| 3 | [Let Agent0 instrument it](03-instrument.md) | 20 min | A merged PR adding OpenTelemetry |
| 4 | [Find your way around](04-explore.md) | 15 min | Traces you can read |
| 5 | [Let Agent0 troubleshoot](05-troubleshoot.md) | 20 min | A merged fix, and working orders |
| 6 | [Alert on it](06-alert.md) | 25 min | A check rule you can defend |
| 7 | [Close the loop](07-close-the-loop.md) | 25 min | An alert that arrives with a draft PR |
| | Wrap | 10 min | |

Work through them in order — each one needs the one before it.

Two files you'll keep coming back to:

- **[prompts.md](prompts.md)** — every Agent0 prompt, ready to copy.
- **[troubleshooting.md](troubleshooting.md)** — when something won't start.

## Before you start

You should have done these ahead of time. If you haven't, do them now — they
cost the room nothing at home and twenty minutes here.

- [ ] **Docker Desktop** installed and running
- [ ] **Ports free:** 3000, 3001, 3002, 8080, and 4317/4318 for later
- [ ] **Forked** <https://github.com/dash0hq/otel-pizza-workshop> and cloned
      *your fork* — every segment from 3 onward opens a PR against a repo you
      need to own
- [ ] **A Dash0 account**, and you know which region it's in — and **which
      URL to log in at**, which may not be `app.dash0.com`. Ask your host.
- [ ] **Ran `docker compose up` once** so the images are built and cached
- [ ] Optional: the **GitHub CLI** (`gh`), which makes the fork step one
      command instead of a browser trip

Pre-pull the base images if you're on conference wifi — a room full of people
pulling `node:20-alpine` at once will hit Docker Hub's anonymous rate limit:

```bash
docker pull node:20-alpine
docker pull nginx:alpine
docker pull otel/opentelemetry-collector-contrib
```

## One thing to know about the agent

**Over MCP, Agent0 reads and diagnoses. It does not act.** Investigating from
your editor works fine, but anything that changes something — editing code,
opening a PR, posting a message — happens by continuing that thread **in the
Dash0 app**, with the GitHub connector attached to your fork.

So: investigate wherever you like, act in Dash0. Each segment says which one
you're in.

## When your agent goes sideways

It will, for someone, at some point. Twenty-five agents produce twenty-five
different instrumentations and a few of them are wrong.

**Don't burn the segment debugging it. Ask the host.** They have working
reference versions of the agent-driven steps and can get you back with the
group in a couple of minutes. That's what they're there for, and using it
is not falling behind.

Come back to the interesting failure afterwards — an agent that produced
something wrong is worth understanding, just not at the cost of the next
forty minutes.
