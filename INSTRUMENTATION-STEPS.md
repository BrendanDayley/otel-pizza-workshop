# Step-by-Step Instrumentation Guide

Follow these steps to add OpenTelemetry observability to the Pizza Order Tracker.

## Overview: What We're Going to Do

We'll add observability to all 3 services (order, kitchen, delivery) by:

1. **Installing OpenTelemetry packages** - 2 npm packages per service
2. **Configuring auto-instrumentation** - Adding environment variables to Dockerfiles
3. **Setting up the collector** - Creating the telemetry pipeline
4. **Updating docker-compose** - Connecting everything together

---

## Step 1: Instrument the Order Service

### 1a. Install OpenTelemetry Packages

Navigate to the order service and install the packages:

```bash
cd pizza-app/order-service
npm install @opentelemetry/api@1.9.1 @opentelemetry/auto-instrumentations-node@0.80.0
```

**What just happened:**
- npm installed 2 packages
  - `@opentelemetry/api` - Core OpenTelemetry API
  - `@opentelemetry/auto-instrumentations-node` - Auto-instruments Express, Axios, HTTP, etc.
- npm automatically updated `package.json`
- npm created/updated `package-lock.json`

### 1b. Configure the Dockerfile

Open `pizza-app/order-service/Dockerfile` in your editor.

**Find this section:**
```dockerfile
FROM node:20.20.2-alpine3.23
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

**Add these lines AFTER `COPY . .`:**
```dockerfile
# Enable OpenTelemetry auto-instrumentation
ENV NODE_OPTIONS="--require @opentelemetry/auto-instrumentations-node/register"

# Configure OpenTelemetry
ENV OTEL_SERVICE_NAME=order-service
ENV OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
ENV OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
```

**What these environment variables do:**
- `NODE_OPTIONS` - Loads OpenTelemetry before your app starts (auto-instrumentation!)
- `OTEL_SERVICE_NAME` - Names your service in traces
- `OTEL_EXPORTER_OTLP_ENDPOINT` - Where to send telemetry (the collector)
- `OTEL_EXPORTER_OTLP_PROTOCOL` - Use HTTP protocol

---

## Step 2: Instrument Kitchen and Delivery Services

Now do exactly the same two steps for the other two services. Nothing is pre-done -
all three services start out uninstrumented, and all three are yours to instrument.

Only two things change per service: the **port** in `EXPOSE` (leave it alone) and the
value of **`OTEL_SERVICE_NAME`**. Getting that name wrong is the single most common
mistake here - every span ends up attributed to the wrong service and the trace looks
like one service calling itself.

### 2a. Kitchen Service

**Install packages:**
```bash
cd ../kitchen-service
npm install @opentelemetry/api@1.9.1 @opentelemetry/auto-instrumentations-node@0.80.0
```

**Edit `pizza-app/kitchen-service/Dockerfile`:**
Add the same environment variables AFTER `COPY . .`:
```dockerfile
# Enable OpenTelemetry auto-instrumentation
ENV NODE_OPTIONS="--require @opentelemetry/auto-instrumentations-node/register"

# Configure OpenTelemetry
ENV OTEL_SERVICE_NAME=kitchen-service
ENV OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
ENV OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
```

**Important:** Use `OTEL_SERVICE_NAME=kitchen-service` (not order-service!)

### 2b. Delivery Service

**Install packages:**
```bash
cd ../delivery-service
npm install @opentelemetry/api@1.9.1 @opentelemetry/auto-instrumentations-node@0.80.0
cd ../..
```

**Edit `pizza-app/delivery-service/Dockerfile`:**
Add the same environment variables AFTER `COPY . .`:
```dockerfile
# Enable OpenTelemetry auto-instrumentation
ENV NODE_OPTIONS="--require @opentelemetry/auto-instrumentations-node/register"

# Configure OpenTelemetry
ENV OTEL_SERVICE_NAME=delivery-service
ENV OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
ENV OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
```

**Important:** Use `OTEL_SERVICE_NAME=delivery-service`

---

## Step 3: Create OpenTelemetry Collector Config

> [!NOTE]
>
> You should have already create a Dash0 account (free) and stored the Auth Token on an .env file

### Create Collector Config

Create a new file `pizza-app/otel-collector-config.yaml` and replace the Dash0 endpoint and auth token.

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  # memory_limiter must be FIRST in every pipeline so it can reject data
  # before the collector does any work on it.
  memory_limiter:
    check_interval: 1s
    limit_mib: 512
  # batch must come AFTER memory_limiter. It groups spans/metrics/logs into
  # fewer, larger export requests - fewer round trips, much less CPU.
  batch:
    timeout: 5s
    send_batch_size: 512
    send_batch_max_size: 1024

exporters:
  otlp:
    endpoint: ${env:DASH0_ENDPOINT}
    headers:
      authorization: "Bearer ${env:DASH0_AUTH_TOKEN}"

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [otlp]
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [otlp]
    logs:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [otlp]
```

**What this does:**
- **Receivers** - Accepts telemetry from your services via OTLP (gRPC and HTTP)
- **Processors**
  - `memory_limiter` prevents the collector from using too much memory (good practice!)
  - `batch` batches telemetry before export. Always list it *after* `memory_limiter`.
- **Exporters** - Sends to Dash0 using your credentials
- **Pipelines** - Connects receivers → processors → exporters. There is one pipeline
  per signal: **traces**, **metrics** and **logs**. All three share the same receiver
  and exporter here, so a single OTLP endpoint carries everything.

> [!NOTE]
>
> The metrics and logs pipelines only carry data if the SDK actually emits those
> signals. `@opentelemetry/auto-instrumentations-node/register` exports traces by
> default; if you see no metrics or logs in Dash0, set `OTEL_METRICS_EXPORTER=otlp`
> and `OTEL_LOGS_EXPORTER=otlp` alongside the other `OTEL_*` variables in your
> Dockerfiles. A pipeline that receives nothing is not an error - the collector just
> logs that it started.

---

## Step 4: Update Docker Compose

Edit `pizza-app/docker-compose.yml` and add the collector service.

**Add this at the bottom of the file:**

```yaml
  otel-collector:
    # Pinned on purpose: `:latest` means a different collector for every
    # participant, and a different one again next month.
    image: otel/opentelemetry-collector-contrib:0.161.0
    command: ["--config=/etc/otel-collector-config.yaml"]
    volumes:
      - ./otel-collector-config.yaml:/etc/otel-collector-config.yaml
    ports:
      - "4317:4317"   # OTLP gRPC
      - "4318:4318"   # OTLP HTTP
    environment:
      - DASH0_ENDPOINT=${DASH0_ENDPOINT}
      - DASH0_AUTH_TOKEN=${DASH0_AUTH_TOKEN}
```

**Also add `otel-collector` to `depends_on` of each service:**

`docker-compose.yml` uses the long `depends_on` form (a map, not a list) so it can
wait for health, so add the collector the same way. The collector image has no shell
to health-check with, so `service_started` is the right condition for it:

```yaml
    depends_on:
      otel-collector:
        condition: service_started
```

**Example for order-service:**
```yaml
  order-service:
    build: ./order-service
    ports:
      - "3000:3000"
    environment:
      - KITCHEN_SERVICE_URL=http://kitchen-service:3001
      - DELIVERY_SERVICE_URL=http://delivery-service:3002
    healthcheck:
      # ... leave the existing healthcheck alone ...
    depends_on:
      kitchen-service:
        condition: service_healthy
      delivery-service:
        condition: service_healthy
      otel-collector:              # add these
        condition: service_started #  two lines
```

Do the same for `kitchen-service` and `delivery-service` (they have no `depends_on`
yet, so add the whole block).

---

## Step 5: Rebuild and Run

```bash
# Make sure you're in the pizza-app directory
cd pizza-app

# Rebuild with new dependencies
docker compose build

# Start everything
docker compose up
```

---

## Step 6: Verify It Works

1. **Open the app**: http://localhost:8080
2. **Order a pizza**: Fill the form and submit
3. **Open Dash0**: https://app.dash0.com
4. **See your trace**: Click "Traces" in the sidebar. You should see traces appearing!

---

## What You Just Did

- Installed OpenTelemetry packages for 3 services  
- Configured auto-instrumentation with environment variables  
- Set up an OpenTelemetry Collector  
- Connected everything to Dash0  

**Total code changes:** 0 lines! Just npm install and configuration.

---
## Cleanup

When you're done with the workshop, you can stop and clean up the Docker containers:

### Stop Services

```bash
docker compose down
```

This stops and removes all containers, but keeps the images.

### Full Cleanup (Optional)

If you want to remove everything including images and volumes:

```bash
# Stop and remove containers, networks, and volumes
docker compose down -v

# Remove images (optional - saves disk space)
docker compose down --rmi all
```

### Quick Restart

If you want to restart later:

```bash
# Start services again
docker compose up

# Or in detached mode (background)
docker compose up -d
```

---


## Troubleshooting

**No traces appearing?**
- Check `.env` has correct `DASH0_AUTH_TOKEN`
- Verify `DASH0_ENDPOINT` matches your region
- Wait 10-15 seconds for traces to appear
- Check collector logs: `docker compose logs otel-collector`

**Build errors?**
- Make sure you saved all files
- Verify Dockerfile syntax is correct
- Try `docker compose build --no-cache`

**Services won't start?**
- Check Docker is running
- Verify ports aren't in use
- Run `docker compose logs` to see errors

---

## Next Steps

Now that you have observability:
- Order more pizzas and explore traces
- Try the debugging scenarios (SLOW_KITCHEN, NO_DRIVERS)
- Click on spans to see attributes
- Follow the request flow across services

Happy observing!
