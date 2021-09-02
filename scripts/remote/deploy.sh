#!/usr/bin/env bash
set -o errexit #abort if any command fails

# to be copied into place at deploy time, then rm'd

if [ -z "$1" ]; then
  echo "Build artifact not specified, exiting"
  exit -1
fi

if [ -z "$2" ]; then
  echo "No project specified, exiting"
  exit -1
fi

BUILD=$1
PROJ=$2
DIR=$(echo "$BUILD" | sed -E "s/(.*).tar.gz$/\1/g")

echo "DIR: $DIR; BUILD: $BUILD"

mkdir -p /tmp/$DIR
tar -xzf /tmp/$BUILD -C /tmp/$DIR

mkdir -p /home/<redacted>/$PROJ
echo "previous builds in case of rollback"
# ls -al /home/<redacted>/$PROJ/git-build*
echo "removing previous build links"
rm -f /home/<redacted>/$PROJ/git-build*
rsync -a /tmp/$DIR/ /home/<redacted>/$PROJ/
chown -R <redacted>:<redacted> /home/<redacted>/$PROJ
su - <redacted> << EOF
  cd /home/<redacted>/$PROJ
  source .env
  npm i --production --registry=http://nexus.redacted.example.com/repository/npm/
  pm2 startOrRestart process.json --update-env
  logout
EOF
