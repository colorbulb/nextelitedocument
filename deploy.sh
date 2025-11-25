#!/bin/bash

set -e  # Exit on any error

echo "🔨 Building project..."
npm run build || exit 1

echo "🚀 Deploying to Firebase..."
firebase deploy --only hosting || exit 1

echo "📦 Staging changes..."
git add .

# Generate commit message with summary of changes
CHANGED_FILES=$(git diff --cached --name-only | sed 's|src/||g' | sed 's|\.jsx||g' | sed 's|\.js||g' | sed 's|\.css||g' | sed 's|\.tsx||g' | sed 's|\.ts||g' | head -5 | tr '\n' ', ' | sed 's/, $//')
TIMESTAMP=$(date +'%Y-%m-%d %H:%M:%S')

if [ -z "$CHANGED_FILES" ]; then
  COMMIT_MSG="Deploy to Firebase - $TIMESTAMP"
else
  COMMIT_MSG="Deploy: Updated $CHANGED_FILES - $TIMESTAMP"
fi

echo "💾 Committing changes: $COMMIT_MSG"
# Only commit if there are changes (disable set -e for this command)
set +e
git commit -m "$COMMIT_MSG"
COMMIT_EXIT_CODE=$?
set -e

if [ $COMMIT_EXIT_CODE -ne 0 ]; then
  echo "⚠️  No changes to commit or commit failed (this is OK)"
fi

echo "📤 Pushing to remote..."
git push || exit 1

echo "✅ Deployment complete!"

