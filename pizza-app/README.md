# Pizza Order Tracker

This is a simple pizza ordering system with 3 microservices to help learning observability.

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

## Running the App (Without Observability)

```bash
docker compose up
```

Then open http://localhost:8080 and order a pizza!

## The Problem: Black Box

If you look at the logs in your terminal you'll see messages like:

```
order-service    | Order received: PIZZA-123...
kitchen-service  | Starting to cook...
delivery-service | Assigning driver...
```

**But you can't answer**:
- How long did each step take?
- Which service is the bottleneck?
- How do these operations relate?
- What happens when there's an error?

You can see that things are happening, but you have no visibility into the details. **This is a black box!** 

## Adding Observability

Follow the **[INSTRUMENTATION-STEPS.md](../INSTRUMENTATION-STEPS.md)** guide to add OpenTelemetry observability to this app.

You'll:
1. Install OpenTelemetry packages (2 per service)
2. Configure auto-instrumentation in Dockerfiles
3. Set up an OpenTelemetry Collector
4. Connect to [Dash0](www.dash0.com)


## Debugging Scenarios

Once you've added observability, try these scenarios:

### Slow Kitchen (Oven is Broken)
```bash
SLOW_KITCHEN=true docker compose up
```

Order a pizza and use Dash0 to find which service is slow!

### No Drivers Available
```bash
NO_DRIVERS=true docker compose up
```

See how errors appear in traces.

### Random Errors (20% failure rate)
```bash
ERROR_RATE=0.2 docker compose up
```

Watch how distributed tracing helps you debug intermittent issues.

## Services Overview

### Order Service
- Receives orders from the frontend
- Validates the order
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
- **OpenTelemetry** - Observability (after instrumentation)

## Ports

- `3000` - Order Service
- `3001` - Kitchen Service
- `3002` - Delivery Service
- `8080` - Frontend
- `4317` - OpenTelemetry Collector (gRPC) - after instrumentation
- `4318` - OpenTelemetry Collector (HTTP) - after instrumentation

Happy observing!
