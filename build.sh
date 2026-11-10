#!/bin/sh
# Builds the single-file client into server/public/index.html
cd "$(dirname "$0")"
mkdir -p server/public
{
  printf '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%%}[hidden]{display:none!important}</style>\n</head>\n<body>\n'
  cat src/shell.html
  echo '<script>'; echo '"use strict";'
  for f in src/01-util.js src/02-char.js src/03-audio.js src/04-net.js src/05-games.js src/07-fps.js src/07b-gfx.js src/07c-guns.js src/10-nx-core.js src/10a-nx-tex.js src/10b-nx-sky.js src/11-nx-world.js src/11z-nx-kit.js src/11a-nx-office.js src/11b-nx-farm.js src/11c-nx-vault.js src/11d-nx-desert.js src/11e-nx-roof.js src/13-nx-scene.js src/13a-nx-decals.js src/14-nx-post.js src/08-ops.js src/09-race.js src/06-app.js; do cat "$f"; echo; done
  echo '</script>'
  printf '</body>\n</html>\n'
} > server/public/index.html
wc -c server/public/index.html
