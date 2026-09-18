#!/bin/bash
# Capture ONLY the Google Chrome window — its own content, even if another
# app (Orca, a terminal) is sitting on top of it. Does not steal focus.
#
#   ./shot.sh 06-first-trace.png
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)/screenshots"
mkdir -p "$DIR"

NAME="${1:?usage: shot.sh NN-description.png}"
[[ "$NAME" == *.png ]] || NAME="$NAME.png"
OUT="$DIR/$NAME"

WID=$(/usr/bin/python3 -c "
from Quartz import CGWindowListCopyWindowInfo, kCGWindowListOptionOnScreenOnly, kCGNullWindowID
ws = CGWindowListCopyWindowInfo(kCGWindowListOptionOnScreenOnly, kCGNullWindowID)
c = [w for w in ws
     if w.get('kCGWindowOwnerName') == 'Google Chrome'
     and w.get('kCGWindowLayer') == 0
     and w.get('kCGWindowBounds', {}).get('Height', 0) > 200]
print(c[0]['kCGWindowNumber'] if c else '')
" 2>/dev/null)

if [[ -z "$WID" ]]; then
  echo "No Chrome window found — is Chrome open?" >&2
  exit 1
fi

# -l <windowid> grabs that window's own surface; -o drops the drop shadow.
screencapture -x -o -l "$WID" "$OUT"
echo "$OUT"
