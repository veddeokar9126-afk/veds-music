#!/bin/bash
cd "$(dirname "$0")"
echo "Starting Kafla at http://localhost:8000"
echo "Keep this window open. Close it to stop the site."
(sleep 1; open http://localhost:8000) &
python3 -m http.server 8000
