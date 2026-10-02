#!/bin/bash
cd "$(dirname "$0")"
echo "Kafla running at http://localhost:8000  (press Ctrl+C to stop)"
(sleep 1; xdg-open http://localhost:8000 >/dev/null 2>&1) &
python3 -m http.server 8000
