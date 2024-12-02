#!/bin/sh
set -e

# Volume is persisted so remove old build and copy new one
mkdir -p /frontend/.shared
rm -rf /frontend/.shared/*
cp -r /frontend/dist/* /frontend/.shared/
