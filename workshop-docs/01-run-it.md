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

The form needs a name as well as a pizza and a size — any name will do.
Order these four, in this order, and write down what happens:

| # | Your Name | Pizza | Size | What you see |
|---|---|---|---|---|
| 1 | anything | Margherita | Small | |
| 2 | anything | Margherita | Medium | |
| 3 | anything | Margherita | **Large** | |
| 4 | anything | **Hawaiian** | Small | |

Two of them fail.

## Look at what you were told

Open devtools → Network, and click the failed request. It's the `POST` to
`localhost:3000/order` — the frontend is served from `:8080` but calls the
order service directly, so the request you want is cross-origin and won't be
under the page's own host.

The response body is:

```json
{
  "error": "Failed to process order",
  "details": "Request failed with status code 503"
}
```

Now look at the other failure. Same flat `500`, same useless `error` — but a
different code buried in `details`. **Write both codes down.** That
difference is the only evidence you currently have that these might be two
separate problems, and the browser never shows it: the page displays
`error`, not `details`.

Now the logs. In the terminal running compose:

```
order-service | {"level":50,...,"orderId":"PIZZA-1731...","err":{...},"msg":"Error processing order"}
```

The services log as JSON — they use [pino](https://getpino.io), which is
what a production Node service would do. If it's hard to read, pipe it
through `jq`.

That's everything order-service — the one the browser talks to — is prepared
to tell you. It caught an error from somewhere downstream and forwarded the
status code without the reason.

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

## Now go digging in the logs

You have three services and two failures. Go and look:

```bash
docker compose logs delivery-service | tail -20
docker compose logs kitchen-service | tail -20
```

**One of your two failures explains itself here.** A service logged exactly
why it refused, and it's not subtle once you're looking at the right
service. Find it.

**The other one doesn't.** Go and look for it. The service logs that it
started handling the order, and then — nothing. No error, no refusal, no
line at all. The failure is real, the response code proves it, and the log
is silent.

That asymmetry is the actual lesson, and it's worth more than either failure
on its own:

- Logging is **something a developer remembered to write.** The first
  failure was logged because somebody thought to log it. The second wasn't
  because nobody did.
- You only found the first one because you already knew which service to
  look in — and you only knew that because there are three. On a system with
  forty services, "grep everything" is not a strategy.
- Even having found it, **nothing ties that line to your order.** Look
  closely at the most diagnostic line in the delivery logs — the one
  showing how many drivers were eligible. It has no `orderId` on it at all,
  because the function that logs it was never given one. At twenty orders a
  second, which of those was yours?

> **This is the argument for tracing.** Not "logs are bad" — logs are great,
> right up to the moment the failure crosses a service boundary. There, the
> cause is dropped, and no amount of reading logs puts it back. A trace
> keeps both halves attached to the same request.

Hold onto the second failure — the silent one. When you get to segment 5,
notice whether the agent can explain it, and what it used to do so.

## Ordering from the terminal

You'll want this later, and it's easier to get right now than at speed in
segment 7. The frontend posts to the order service directly:

```bash
curl -s -X POST http://localhost:3000/order \
  -H 'Content-Type: application/json' \
  -d '{"customerName":"Test","pizzaType":"Hawaiian","size":"Small"}'
```

That's `/order` on port 3000 — not a path under the frontend's `:8080`, and
not `/api/orders`.

## Keep it running

Leave compose up — you'll be rebuilding into it for the rest of the session.
It runs in the foreground and keeps printing, so **open a second terminal**
for every other command in this workshop. If you'd rather have your prompt
back, `Ctrl+C` and restart it detached:

```bash
docker compose up -d
docker compose logs -f        # when you want to watch
```

---

**Done when** you've reproduced both failures, and can explain one of them
but not the other.

**Next:** [2. Connect Dash0 →](02-connect-dash0.md)
