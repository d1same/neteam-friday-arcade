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
