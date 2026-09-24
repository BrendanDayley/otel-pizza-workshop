# Pizza Order Tracker

A pizza ordering system built from three microservices and a web frontend.

## What's Inside

- **Order Service** (Port 3000): Receives pizza orders and coordinates with other services
- **Kitchen Service** (Port 3001): Checks availability and cooks pizzas
- **Delivery Service** (Port 3002): Assigns drivers for delivery
- **Frontend** (Port 8080): Simple web UI for ordering pizzas

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
handful of environment variables. They send traces, metrics and logs to Dash0
over OTLP/gRPC.

Configure it once, from inside `pizza-app/`:

```bash
cp .env.template .env
# then fill in DASH0_AUTH_TOKEN and DASH0_ENDPOINT
```

`DASH0_ENDPOINT` must be the OTLP/gRPC endpoint for your region, port `:4317`
included — find it under **Settings → Endpoints** in Dash0. The ingress only
accepts static `auth_*` tokens, not OAuth ones. If your network blocks port
4317, set `DASH0_OTLP_PROTOCOL=http/protobuf` and drop `:4317` from the
endpoint.

One order produces a single trace across all three services: the frontend's
`POST /order`, both kitchen calls, and the delivery call, as nested spans. Each
`pino` log line is exported too, carrying the trace and span ID of the request
that wrote it, so a log and the trace it came from are two clicks apart.

If the variables are missing, the services still run and serve orders; they just
log export failures. `OTEL_SDK_DISABLED=true` turns instrumentation off
entirely.

### Browser monitoring (optional)

Setting `DASH0_WEB_ENDPOINT` and `DASH0_WEB_AUTH_TOKEN` loads the Dash0 Web SDK
into the frontend, which adds page loads, web vitals, JavaScript errors, and
browser-side requests, and links each order back to its backend trace.

That token is served to browsers as part of the page. Create a **separate** auth
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
