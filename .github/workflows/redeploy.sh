#!/bin/sh
# Trigger redeploy by pushing a dummy commit marker
git commit --allow-empty -m "ci: trigger rebuild $(date +%s)" && git push origin main