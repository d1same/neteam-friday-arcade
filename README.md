# Neteam Friday Arcade

Multiplayer party games for Friday afternoons at Neteam Solutions. Everyone makes their own tech character (and can upload a photo to use as its face), hangs out in the NOC, and one person starts a game for the whole room. A scoreboard keeps points across every game and every Friday.

## Run it with Docker

Every push to `main` builds a multi-arch image (amd64 + arm64) and publishes it to GitHub's registry as `ghcr.io/d1same/neteam-friday-arcade:latest`.

On the Docker host:

```bash
# one time, only while the repo/package is private (token needs read:packages)
echo <GITHUB_TOKEN> | docker login ghcr.io -u d1same --password-stdin

# grab docker-compose.yml from this repo, then:
docker compose pull
docker compose up -d
```

Open `http://<your-docker-host>:4802` and share it with the team. Anyone on the same network or VPN can join from a laptop or phone.

Without compose:

```bash
docker run -d --name neteam-friday-arcade -p 4802:4802 -v arcade-data:/data --restart unless-stopped ghcr.io/d1same/neteam-friday-arcade:latest
```

To update later: `docker compose pull && docker compose up -d`.

- Scores live in the `arcade-data` volume (`/data/arcade-db.json`), so they survive restarts and upgrades. Uploaded profile photos are kept next to them in `/data/avatars/`.
- Want a different host port? Change the left side of `"4802:4802"`.
- To build from source instead: `docker compose -f docker-compose.build.yml up -d --build`.
- Health check: `GET /health`. Raw scoreboard export: `GET /api/scores`.
- Behind a reverse proxy (nginx, Traefik, Caddy), pass WebSocket upgrades through on `/ws`.

## The games

| Game | What you do | Controls |
|---|---|---|
| Breach Protocol | Red Team vs Blue Team, round by round at Neteam HQ. Buy guns and armor in the buy phase. Red plants a ransomware payload at site A (server room) or B (network closet); Blue wipes Red out or defuses it. One life per round, first to 7. Bots fill teams up to even sides. | WASD, mouse aim, click fire, R reload, E plant/defuse, B buy, Tab scores |
| Zero-Day Deathmatch | Free-for-all on the same map with every weapon unlocked. Respawn after 3 s. First to 25 eliminations or most after 5 minutes. | WASD, mouse aim, 1-4 weapons, right-click scope |
| Neteam Grand Prix | 3-lap street race around a night-time Manhattan circuit. Boost pads, drift for a turbo, grass slows you down. | W/S gas and brake, A/D steer, Space drift, R reset, C camera |

Every game has a fullscreen button (or press F). Mouse invert and sensitivity are in the Aim panel. The older 2D games and Firewall Frenzy are retired from the lobby but their past scores still show.

Bots (Patch Bot, Ping Bot, Sr. Tech Bot, …) fill empty seats (up to even 3v3 teams in Breach Protocol, 4 shooters in Deathmatch, 6 cars in the race). Untick "Fill empty seats with bots" to turn them off.

## Scoring

Each match gives people points by placing among people only (bots never take your points): 1st 10, 2nd 7, 3rd 5, 4th 3, everyone else 1. A match counts when 2 or more people play; solo rounds are practice. The scoreboard has Today, All time, and Records (best score per game).

## How it works

- `server/server.js`: a small Node server (one dependency, `ws`). It serves the game, relays live player state between browsers, and saves scores to a JSON file.
- The person who presses Start runs that game's simulation in their browser and shares it with everyone. The host loop runs off a worker clock, so the match keeps its pace if the host switches tabs (the host's own view still pauses while hidden).
- A dropped connection reconnects on its own and takes the same seat back, so a short network blip doesn't remove you from a match.
- Firewall Frenzy uses three.js r159, served locally from `server/public/vendor/` so it works without internet access.
- Identity is a random id kept in each browser, with no logins. It's meant for a trusted team on your own network.

## Security

There are no logins, and the host's browser decides match results, so this is for a trusted team on your own network: don't expose it to the internet. Within that, the server protects itself and the scoreboard:

- Malformed or oversized messages are dropped; they can't crash the server. Each connection has a message budget, and there are caps on connections, stored records and uploaded photos.
- The scoreboard is append-only. Browsers can't delete or rewrite saved matches, a match is only accepted from the browser hosting that game, its fields are validated, and league points are computed by the server from the placings.
- Each browser can only write its own profile. Photos must be real JPEGs up to 256 KB and are served with a locked-down content type.
- Web pages on other sites can't connect to the arcade from a coworker's browser (same-site check on the WebSocket and uploads), and the page is sent with a Content-Security-Policy and related headers.

Optional environment variables:

| Variable | Default | What it does |
| --- | --- | --- |
| `ALLOWED_ORIGINS` | empty | Extra hostnames allowed to connect, comma separated. Set this if you put the arcade behind a reverse proxy that changes the Host header. |
| `ORIGIN_CHECK` | on | `off` disables the same-site check. |
| `MAX_CLIENTS` | 200 | Most browser connections at once. |
| `MAX_PER_IP` | 64 | Most connections from one address. |

Because of the Content-Security-Policy, game assets must be served by the arcade itself (`server/public/vendor`, `sfx`, `models`), not from external CDNs.

## Editing

The client is built from `src/` into `server/public/index.html`:

```bash
./build.sh                       # rebuild the page
cd server && npm install && node server.js   # run locally on :4802 (scores in server/data)
```

Rebuild the image after changes: `docker compose up -d --build`.

## Graphics engine

The 3D games draw with the arcade's own renderer (the `src/1*-nx-*.js` files) on each player's graphics card:

- Every map is generated from its grid in `src/08-ops.js` by `src/11-nx-world.js` and a theme file (`src/11a-nx-office.js` for Neteam HQ). The same code runs in the browser and in the bake tool, so the picture and the lighting always match.
- Soft shadows and bounced light are computed ahead of time by `tools/bake.js` and shipped as `server/public/models/lm-<map>-a.png`, `lm-<map>-b.png` and `lm-<map>.bin`. The sun, the shadows of players and props, reflections and all film effects (exposure, bloom, ambient occlusion, colour grade) run live.
- Materials are photo-scanned texture sets (`t-<name>-c/n/m.jpg`) and the skies are real HDR photos (`sky-<name>.jpg`, `sky-<name>-env.png`), all CC0 from Poly Haven and ambientCG. Sources are listed in `server/public/models/CREDITS.txt`.
- The Graphics setting picks a quality level: Auto reads the graphics card's name and chooses for you, and the picture resolution adapts while you play to keep the frame rate. Performance is meant for office laptops, Ultra for gaming cards.

After changing a map's layout or a theme, bake its lighting again, then rebuild the page:

```bash
cd tools && npm install          # one time
node tools/world.js hq           # optional: print what the generator makes for a map
node tools/bake.js hq            # about 12 seconds on 4 cores; use "all" for every map
./build.sh
```

A map whose baked files are missing or out of date still runs, with flat lighting, and the browser console says so. `node tools/assets.js` downloads and prepares the texture sets and skies again (they are already in the repo).
