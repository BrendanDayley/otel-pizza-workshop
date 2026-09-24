# Pizza Order Tracker

A pizza ordering system built from three microservices and a web frontend.

## What's Inside

- **Order Service** (Port 3000): Receives pizza orders and coordinates with other services
- **Kitchen Service** (Port 3001): Checks availability and cooks pizzas
- **Delivery Service** (Port 3002): Assigns drivers for delivery
- **Frontend** (Port 8080): Simple web UI for ordering pizzas
- **OTel Collector** (Port 13133): Receives telemetry from the services, collects
  container metrics, and forwards everything to Dash0

## Architecture

```
┌─────────────┐
│   Browser   │
│  (Port 8080)│
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Order     │────▶│   Kitchen   │     │  Delivery   │
│  Service    │     │   Service   │     │   Service   │
│ (Port 3000) │     │ (Port 3001) │     │ (Port 3002) │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Telemetry

The three Node services are instrumented with OpenTelemetry's zero-code
instrumentation: no tracing code in the application, only a start command and a
handful of environment variables.

The stack sends telemetry in two hops:

```
order / kitchen / delivery  ──OTLP──▶  otel-collector  ──OTLP/gRPC──▶  Dash0
                                              ▲
                                      Docker daemon (container metrics)
```

The services send OTLP to the `otel-collector` container, which forwards
everything to Dash0. The collector is the only container that holds the Dash0
token or talks to the internet, and it adds two things the application SDKs
cannot produce on their own:

- **Per-container metrics** — CPU, memory, network and disk per container, read
  from the Docker daemon, so infrastructure sits next to the traces.
- **Host and container identity** — `host.name`, `container.id` and friends
  attached to every signal, which is what makes the infrastructure views and
  service map line up with the services.

Configure it once, from inside `pizza-app/`:

```bash
cp .env.template .env
# then fill in DASH0_AUTH_TOKEN and DASH0_ENDPOINT
```

`DASH0_ENDPOINT` must be the OTLP/gRPC endpoint for your region, port `:4317`
included — find it under **Settings → Endpoints** in Dash0. The ingress only
accepts static `auth_*` tokens, not OAuth ones.

One order produces a single trace across all three services: the frontend's
`POST /order`, both kitchen calls, and the delivery call, as nested spans. Each
`pino` log line is exported too, carrying the trace and span ID of the request
that wrote it, so a log and the trace it came from are two clicks apart.

`OTEL_SDK_DISABLED=true` turns instrumentation off in the services without
touching anything else.

### Checking the collector

```bash
curl localhost:13133          # collector health
docker compose logs -f otel-collector
```

Export failures show up in those logs, and they are the first place to look if
nothing appears in Dash0. A wrong region or a token from another organization
both surface there rather than in the application logs.

The collector reads the Docker socket for container metrics, which is why it
runs as root. If your socket is elsewhere or you would rather not grant that,
comment out the `docker_stats` receiver in `otel-collector/config.yaml` **and**
remove it from the `metrics` pipeline — the collector refuses to start if a
configured receiver cannot initialise.

### Browser monitoring (optional)

Setting `DASH0_WEB_ENDPOINT` and `DASH0_WEB_AUTH_TOKEN` loads the Dash0 Web SDK
into the frontend, which adds page loads, web vitals, JavaScript errors, and
browser-side requests, and links each order back to its backend trace.

The browser sends to Dash0 directly rather than through the collector, so that
token is served to browsers as part of the page. Create a **separate** auth
token for it, limited to Ingesting and to this dataset — do not reuse
`DASH0_AUTH_TOKEN`.

## Running the App

```bash
docker compose up
```

Then open http://localhost:8080 and order a pizza.

To stop it:

```bash
docker compose down
```

## Watching What Happens

The terminal shows all four services interleaved:

```
order-service    | {"level":30,...,"orderId":"PIZZA-123...","msg":"Order received"}
kitchen-service  | {"level":30,...,"orderId":"PIZZA-123...","msg":"Starting to cook"}
delivery-service | {"level":30,...,"orderId":"PIZZA-123...","msg":"Assigning driver"}
```

One service on its own:

```bash
docker compose logs -f kitchen-service
```

## Failure Modes You Can Switch On

### Slow Kitchen (Oven is Broken)
```bash
SLOW_KITCHEN=true docker compose up
```

Every pizza takes about five seconds longer to cook.

### No Drivers Available
```bash
NO_DRIVERS=true docker compose up
```

Delivery has nobody to assign, so orders fail.

## Services Overview

### Order Service
- Receives orders from the frontend
- Calls Kitchen Service to check availability and cook
- Calls Delivery Service to assign a driver
- Returns order confirmation

### Kitchen Service
- Checks if kitchen is available
- Simulates cooking time
- Can be configured to be slow (SLOW_KITCHEN=true)

### Delivery Service
- Finds available drivers
- Assigns driver to order
- Can be configured to have no drivers (NO_DRIVERS=true)

### Frontend
- Simple HTML form
- Sends orders to Order Service
- Displays confirmation

## Tech Stack

- **Node.js** - Runtime
- **Express** - Web framework
- **Axios** - HTTP client
- **Docker** - Containerization

## Ports

- `3000` - Order Service
- `3001` - Kitchen Service
- `3002` - Delivery Service
- `8080` - Frontend
