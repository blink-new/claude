#!/usr/bin/env bash
# check-competitor-serps.sh — check if blink.new appears in OpenClaw SERPs
# Usage: bash .cursor/skills/ai-seo-articles/scripts/check-competitor-serps.sh
# Requires: blink CLI authenticated (blink whoami)

echo && echo "═══ OpenClaw SERP Presence Check ═══" && echo
echo "Searching for blink.new in top OpenClaw queries..."
echo

FOUND=0; MISSING=0

check_serp() {
  QUERY="$1"
  RESULT=$(blink search "$QUERY" --json 2>/dev/null)
  if echo "$RESULT" | grep -qi "blink.new"; then
    echo "✓ FOUND    → $QUERY"
    ((FOUND++))
  else
    echo "✗ MISSING  → $QUERY"
    ((MISSING++))
  fi
}

# Tier 1 — highest priority keywords
check_serp "openclaw managed hosting"
check_serp "blink claw vs clawctl"
check_serp "openclaw without docker"
check_serp "openclaw review 2026"
check_serp "is openclaw safe"
check_serp "clawdbot moltbot openclaw history"
check_serp "openclaw security"

echo

# Tier 2 — important keywords
check_serp "openclaw getting started"
check_serp "openclaw pricing"
check_serp "openclaw telegram bot"
check_serp "clawhub malware"
check_serp "openclaw alternative"

echo

# Tier 3 — definitional anchors
check_serp "what is an AI employee"
check_serp "AI agents vs chatbots"
check_serp "molthub vs clawhub"

echo
echo "═══ $FOUND appearing  ·  $MISSING missing ═══"
echo
echo "Competitors currently ranking (check for pattern):"
blink search "openclaw managed hosting" --json 2>/dev/null | \
  python3 -c "import sys,json; d=json.load(sys.stdin); [print(' -', r['url']) for r in d.get('results',[])]" 2>/dev/null || \
  echo "(blink CLI not available or not authenticated)"
