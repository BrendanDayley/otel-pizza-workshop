# OpenTelemetry Pizza Workshop

Learn how to add OpenTelemetry observability to your applications with zero code changes!

**Perfect for:** Developers new to OpenTelemetry and distributed tracing  
**Duration:** 50 minutes  
**Level:** Beginner  
**What you'll build:** Add auto-instrumentation to a 3-service microservices app


## Prerequisites

- **Node.js** installed (v18 or higher) - [download here](https://nodejs.org/)
- **Docker Desktop** installed ([download here](https://www.docker.com/products/docker-desktop))
- **A [Dash0](www.dash0.com) account**
- Basic understanding of APIs and microservices
- A text editor (VS Code, Sublime, etc.)

## Quick Start

### Step 1: Clone the Repository

**Fork first, then clone your fork.** You need to own the remote: the last stage of
this workshop has an AI agent open a pull request against *your* repository.

1. Open <https://github.com/juliafmorgado/otel-pizza-workshop> and click **Fork**
   (top right). Keep the default name, `otel-pizza-workshop`.

2. Clone **your** fork and add the original as `upstream`:

```bash
# replace YOUR-USERNAME with your GitHub username
git clone https://github.com/YOUR-USERNAME/otel-pizza-workshop.git
cd otel-pizza-workshop

# keep a link to the original, so you can pull in fixes during the workshop
git remote add upstream https://github.com/juliafmorgado/otel-pizza-workshop.git

# sanity check: origin = your fork, upstream = the original
git remote -v
```

### Step 2: Create Your Dash0 Account

1. Go to [dash0.com/signup](https://dash0.com/signup)
2. Sign up with your email
3. Verify your email (check your inbox)
4. Log in to Dash0

### Step 3: Get Your Auth Token

1. In Dash0, click on your profile → **Settings**
2. Go to **Auth Tokens**
3. Click **Create Token**
4. Copy the token (starts with `auth_...`)
5. Save it somewhere - you'll need it in the next step

### Step 4: Configure the Workshop

The `.env` file has to live in **`pizza-app/`** - that is the directory Docker
Compose runs from, and Compose only reads the `.env` that sits next to
`docker-compose.yml`. An `.env` in the repo root is ignored.

```bash
cd pizza-app
cp .env.template .env
```

Edit `pizza-app/.env` and add your Dash0 token:

```bash
DASH0_AUTH_TOKEN=auth_your_token_here

# Update the region if needed (check your Dash0 URL)
DASH0_ENDPOINT=https://ingress.us-west-2.aws.dash0.com:4317
# or https://ingress.eu-west-1.aws.dash0.com:4317
```

## Workshop Structure

### Part 1: See the Problem

Run the app without observability and see why you need it.

```bash
cd pizza-app   # you may already be here from Step 4
docker compose up
```

Open http://localhost:8080 and order a pizza. Everything works, but you're flying blind!

### Part 2: Add OpenTelemetry

**This is where YOU instrument the app!** 

There is no copy-paste guide. You direct an agent to instrument the app,
review what it proposes, and merge it.

What has to end up in place:
1. OpenTelemetry auto-instrumentation on all three Node services
2. An OpenTelemetry Collector in `docker-compose.yml`
3. Traces exported to Dash0

### Part 3: Explore Distributed Traces

Open Dash0 and see your instrumented app in action:

Learn to read spans, attributes, and follow requests across services!

### Part 4: Debug with Traces

Practice debugging with your new observability superpowers:

```bash
# Stop services
Ctrl+C

# Enable slow kitchen mode
SLOW_KITCHEN=true docker compose up
```

Order a pizza and find which service is slow using traces!


## Debugging Scenarios

Try these scenarios to practice debugging:

```bash
# Slow kitchen (oven is broken)
SLOW_KITCHEN=true docker compose up

# No drivers available
NO_DRIVERS=true docker compose up

# Random errors (20% failure rate)
ERROR_RATE=0.2 docker compose up
```

## Troubleshooting

**Docker issues?**
- Make sure Docker Desktop is running
- Try `docker compose down` then `docker compose up` again

**Can't see traces in Dash0?**
- Check your `.env` file has the correct token
- Make sure you're looking at the right time range in Dash0
- Verify your region endpoint matches your Dash0 account
- Wait 10-15 seconds for traces to appear

**Services not starting?**
- Check if ports 3000, 3001, 3002, 8080 are available
- Run `docker compose logs` to see error messages
- Try `docker compose build --no-cache`

**Build errors?**
- Make sure you saved all files after editing
- Check that package.json has valid JSON syntax
- Verify Dockerfile syntax is correct

## Learn More

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Dash0 Documentation](https://www.dash0.com/docs)
- [Node.js Auto-Instrumentation](https://opentelemetry.io/docs/languages/js/automatic/)


## License

MIT License - feel free to use this for learning!

