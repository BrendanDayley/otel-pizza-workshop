# OpenTelemetry Pizza Workshop

A small pizza-ordering app built from three Node services and a web frontend.
It ships with no instrumentation. Adding that is the workshop; this file only
covers getting the app running.

## Prerequisites

- **Docker Desktop** — [download here](https://www.docker.com/products/docker-desktop)
- **Node.js** v18 or higher — [download here](https://nodejs.org/) (only needed
  once you start changing the services)
- Ports `3000`, `3001`, `3002` and `8080` free

## Get the code

**Fork first, then clone your fork.** Later stages of the workshop open pull
requests against your repository, so you need to own the remote.

1. Open <https://github.com/dash0hq/otel-pizza-workshop> and click **Fork**.
   Keep the default name.

2. Clone your fork and keep a link to this repository:

```bash
# replace YOUR-USERNAME with your GitHub username
git clone https://github.com/YOUR-USERNAME/otel-pizza-workshop.git
cd otel-pizza-workshop

git remote add upstream https://github.com/dash0hq/otel-pizza-workshop.git
git remote -v
```

## Run it

```bash
cd pizza-app
docker compose up
```

The first build takes a few minutes. When all four containers are up, open
<http://localhost:8080> and order a pizza.

Stop with `Ctrl+C`, or:

```bash
docker compose down            # stop
docker compose down -v         # and volumes
docker compose down --rmi all  # and images
```

## What's running

| Service | Port | Does |
|---|---|---|
| Frontend | 8080 | Order form |
| Order Service | 3000 | Takes the order, calls the other two |
| Kitchen Service | 3001 | Checks availability, cooks |
| Delivery Service | 3002 | Assigns a driver |

Logs from all four are interleaved in the terminal you ran `docker compose up`
in. For one service on its own:

```bash
docker compose logs -f order-service
```

## Failure modes you can switch on

```bash
SLOW_KITCHEN=true docker compose up   # the oven takes ~5s per pizza
NO_DRIVERS=true docker compose up     # nobody is available to deliver
```

## Troubleshooting

**Containers won't start** — check Docker Desktop is running, then
`docker compose down && docker compose up --build`.

**Port already in use** — something else holds 3000, 3001, 3002 or 8080.
`lsof -i :3000` will name it.

**Changed a file and nothing happened** — the services are baked into images.
Rebuild: `docker compose up -d --build`.

**Build fails** — `docker compose build --no-cache`, and check the JSON in any
`package.json` you edited.

## Credits

The pizza app and the original workshop are the work of
[Julia Morgado](https://github.com/juliafmorgado/otel-pizza-workshop).

## License

MIT License — feel free to use this for learning!
