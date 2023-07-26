#!/bin/bash
set -e
shopt -s dotglob

# Volume is persisted so remove old build and copy new one
mkdir -p /frontend/.shared
rm -rf /frontend/.shared/*
cp -r /frontend/.next/* /frontend/.shared/

npm run start