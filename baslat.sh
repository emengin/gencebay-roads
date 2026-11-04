#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
if command -v python3 >/dev/null 2>&1; then
  printf '%s\n' 'GENCEBAY ROADS · http://127.0.0.1:4173 · Çıkış: Ctrl+C'
  exec python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
elif command -v node >/dev/null 2>&1; then
  exec node scripts/serve.mjs
else
  printf '%s\n' 'Python 3 veya Node.js gereklidir. Windows için BASLAT.cmd kullanın.'
  exit 1
fi
