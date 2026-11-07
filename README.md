# Neteam Friday Arcade

Multiplayer party games for Friday afternoons at Neteam Solutions. Everyone makes their own tech character, hangs out in the NOC, and one person starts a game for the whole room. A scoreboard keeps points across every game and every Friday.

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

- Scores live in the `arcade-data` volume (`/data/arcade-db.json`), so they survive restarts and upgrades.
- Want a different host port? Change the left side of `"4802:4802"`.
- To build from source instead: `docker compose -f docker-compose.build.yml up -d --build`.
- Health check: `GET /health`. Raw scoreboard export: `GET /api/scores`.
- Behind a reverse proxy (nginx, Traefik, Caddy), pass WebSocket upgrades through on `/ws`.

## The games

| Game | What you do | Controls |
|---|---|---|
| Coverage Rush | Claim a client's office floor with your network coverage. Firewall walls block your path. Grab access points for a big blast, Fiber Boost for speed, or Lockdown to protect your tiles. Most tiles in 60 s wins. | WASD / arrows, or drag on touch |
| Uptime Sumo | Bump rival techs off the server-room floor while an outage shrinks it. Flashing tiles drop out as holes. Shield makes you unpushable; Heavy makes you hit like a server rack. 3 lives each. | WASD / arrows + Space to dash; on phones drag + DASH |
| Alert Response | Ignore the yellow low-severity decoys. When a red critical alert fires, pick the right containment (isolate host, block IP, reset password, kill process) fastest. Early or wrong fix is −2. 6 rounds. | 1–4, click or tap the fix buttons |
| Firewall Frenzy (3D) | First-person laser tag through the Neteam data center. 3 hits patches a rival, who reboots in 3 s. Overclock, Patch Kit and Firewall Shield pickups. First to 15 tags or most after 3 minutes. | Click to lock mouse, WASD, Shift sprint, click/Space to tag. Phones: left stick, drag to look, TAG button |
| Helpdesk Sprint | Close tickets on ports, subnets, CIDR, RAID, private IP ranges, binary and acronyms. Streaks raise the ticket tier, and P1 incidents (3 steps) pay double plus a +25 bonus. | 1–4, click or tap |

Bots (Patch Bot, Ping Bot, Sr. Tech Bot, …) fill empty seats so there are always at least 4 players. Untick "Fill empty seats with bots" to turn them off.

## Scoring

Each match gives people points by placing among people only (bots never take your points): 1st 10, 2nd 7, 3rd 5, 4th 3, everyone else 1. A match counts when 2 or more people play; solo rounds are practice. The scoreboard has Today, All time, and Records (best score per game).

## How it works

- `server/server.js`: a small Node server (one dependency, `ws`). It serves the game, relays live player state between browsers, and saves scores to a JSON file.
- The person who presses Start runs that game's simulation in their browser and shares it with everyone. Keep that tab in front while hosting, because browsers slow down background tabs.
- Firewall Frenzy uses three.js r159, served locally from `server/public/vendor/` so it works without internet access.
- Identity is a random id kept in each browser, with no logins. It's meant for a trusted team on your own network.

## Editing

The client is built from `src/` into `server/public/index.html`:

```bash
./build.sh                       # rebuild the page
cd server && npm install && node server.js   # run locally on :4802 (scores in server/data)
```

Rebuild the image after changes: `docker compose up -d --build`.
