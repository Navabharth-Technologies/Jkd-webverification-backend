#!/bin/bash
git checkout .github/workflows/deploy.yml
git filter-branch -f --env-filter '
if [ "$GIT_AUTHOR_EMAIL" = "antigravity@google.com" ]; then
    export GIT_AUTHOR_NAME="JKD Mart Dev"
    export GIT_AUTHOR_EMAIL="dev@jkdmart.com"
fi
if [ "$GIT_COMMITTER_EMAIL" = "antigravity@google.com" ]; then
    export GIT_COMMITTER_NAME="JKD Mart Dev"
    export GIT_COMMITTER_EMAIL="dev@jkdmart.com"
fi
' --tag-name-filter cat -- --branches --tags
git push origin HEAD --force
