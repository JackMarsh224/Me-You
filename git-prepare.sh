#!/bin/bash
# Run this once before pushing to GitHub.
# It untracks Replit-specific files that are gitignored but were previously committed.

set -e

echo "Untracking Replit-specific files from git index..."

git rm --cached .replit 2>/dev/null && echo "  ✓ Untracked .replit" || echo "  — .replit already untracked"

echo ""
echo "Done. These files still exist locally but won't be pushed to GitHub."
echo "Now run: git add -A && git commit -m 'chore: prepare for GitHub/Railway deployment'"
