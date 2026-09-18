# 1. Run it. Watch it break.

**10 minutes.** You'll end with a failure you can reproduce and can't explain.

## Start the app

```bash
cd pizza-app
docker compose up
```

First build takes a few minutes. When the log settles, open
<http://localhost:8080>.

## Order some pizzas

Order these four, in this order, and write down what happens:

| # | Pizza | Size | What you see |
|---|---|---|---|
| 1 | Margherita | Small | |
| 2 | Margherita | Medium | |
| 3 | Margherita | **Large** | |
| 4 | **Hawaiian** | Small | |

Two of them fail.

## Look at what you were told

Open the browser's devtools, Network tab, and click the failed request. The
response body is:

```json
{
  "error": "Failed to process order",
  "details": "Request failed with status code 503"
}
```

Now look at the other failure. Same shape. Possibly a different status code
buried in `details`, but the same flat `500`, the same useless `error`.

Now the logs. In the terminal running compose:

```
order-service     | Error processing order PIZZA-1731...: Request failed with status code 503
```

That's it. That's everything the system is prepared to tell you.

## The questions you can't answer

Sit with these for a minute before moving on — the rest of the workshop is
about getting to answer them:

1. **Which service actually failed?** There are three behind the frontend.
2. **Why did it fail?** The message says a request failed. It doesn't say what
   the service was trying to do or what it decided.
3. **Are these two failures the same bug or two different ones?** They look
   identical from here.
4. **How often is this happening?** You found it by ordering four pizzas. How
   would you have found it from production?

The information you want *does* exist — somewhere in those container logs,
something got printed. But it's interleaved with three other services and
nothing ties it to your order. With twenty orders a second, it's gone.

> **This is the whole argument for tracing.** Not "logs are bad" — but that a
> failure crossing a service boundary loses its cause at that boundary, and no
> amount of reading logs puts it back.

## Try the log approach anyway

Genuinely worth ten seconds so nobody wonders later:

```bash
docker compose logs delivery-service | tail -20
docker compose logs kitchen-service | tail -20
```

You may well spot something suspicious. Now ask yourself: **could you have
found that without already knowing which service to look in?** And could you
tell whether it relates to *your* order, or the one someone else placed at the
same moment?

## Keep it running

Leave compose up. You'll be rebuilding into it for the rest of the session.

---

**Done when** you've reproduced both failures and can't name either cause.

**Next:** [2. Connect Dash0 →](02-connect-dash0.md)
