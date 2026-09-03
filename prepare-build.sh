#!/bin/sh

set -e

rm -rf ./apps/build

mkdir -p ./apps/build/api
mv ./apps/api/build/* ./apps/build/api

mkdir -p ./apps/build/public
mv ./apps/web/build/* ./apps/build/public
