#!/bin/bash
set -e

echo "=== LomusTrack / LogPose Starting ==="

# Default PORT to 8000 if not set by host environment (e.g. Render sets $PORT)
PORT="${PORT:-8000}"
export PORT
echo "Server configured on port: $PORT"

# Execute the main command
exec "$@"
