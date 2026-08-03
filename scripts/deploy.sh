#!/usr/bin/env bash

set -e

PAGES="pages"
REPOSITORY="git@github.com:isweibin/isweibin.github.io.git"
BRANCH="gh-pages"

if [ ! -d "$PAGES" ]; then
    echo "Error: output directory '$PAGES' does not exist."
    exit 1
fi

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

cp -a "$PAGES"/. "$tmp"

pushd "$tmp" > /dev/null

git init
git branch -M "$BRANCH"
git remote add origin "$REPOSITORY"

git add .
git commit -m "deploy: update site"

git push -f origin "$BRANCH"

popd > /dev/null
