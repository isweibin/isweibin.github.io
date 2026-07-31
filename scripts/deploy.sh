#!/usr/bin/env bash

set -e

DIST="dist"
REPO="git@github.com:isweibin/isweibin.github.io.git"
BRANCH="gh-pages"

if [ ! -d "$DIST" ]; then
    echo "Error: output directory '$DIST' does not exist."
    exit 1
fi

tmp=$(mktemp -d)

cp -r "$DIST"/* "$tmp"

cd "$tmp"

git init
git branch -M "$BRANCH"

git remote add origin "$REPO"

git add .
git commit -m "deploy: update site"

git push -f origin "$BRANCH"

rm -rf "$tmp"
