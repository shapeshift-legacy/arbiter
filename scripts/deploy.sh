#!/usr/bin/env bash
set -o errexit #abort if any command fails

PARENT_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

function usage() {
  echo "Usage: ./deploy.sh <project> <branch> <env> [<host>]"
}

function _deploy() {
  PROJ=$1
  BRANCH=$2
  DEPLOY_ENV=$3
  HOST=$4
  YOLO=$5
  HOST_FQDN=$4.$3.redacted.example.com

  echo "preparing deploy with branch: $BRANCH and host: $HOST"

  HASH=$(git rev-parse $BRANCH)
  BUILD=arb-$PROJ-$HASH

  echo "building $BUILD"
  if [ ! -d /tmp/$BUILD ]; then mkdir /tmp/$BUILD; fi

  cd projects/$PROJ
  git archive --output=/tmp/$BUILD.tar.gz $HASH
  tar -xzf /tmp/$BUILD.tar.gz -C /tmp/$BUILD
  cd -

  # drop a file showing the build hash
  touch /tmp/$BUILD/git-build-$HASH
  # generate the .env file
  echo "generating config arb-config $DEPLOY_ENV generate-env $HOST $PROJ > /tmp/$BUILD/.env"
  node ./packages/arb-config/bin/index.js $DEPLOY_ENV generate-env $HOST $PROJ > /tmp/$BUILD/.env

  # bundle it all up
  tar -czf /tmp/$BUILD-bundle.tar.gz -C /tmp/$BUILD .

  echo "copying /tmp/$BUILD to $ARBITER_DEPLOY_USER@$HOST_FQDN:/tmp/"
  scp /tmp/$BUILD-bundle.tar.gz $ARBITER_DEPLOY_USER@$HOST_FQDN:/tmp/

  echo "placing deploy scripts"
  scp $PARENT_PATH/remote/deploy.sh $ARBITER_DEPLOY_USER@$HOST_FQDN:/tmp/deploy-$HASH.sh

  echo "running remote deploy script"

  if [[ $YOLO == "yolo" ]]; then
    # THIS WON'T WORK FOR PW WITH SPECIAL CHARACTERS
    echo "yolo mode, no sudo prompt"
    ssh -t $ARBITER_DEPLOY_USER@$HOST_FQDN "echo """$SUDO_PASS""" | /usr/bin/sudo -S bash -c 'sh /tmp/deploy-$HASH.sh $BUILD-bundle.tar.gz $PROJ; rm -f /tmp/deploy*'"
  else
    # force deployer to enter sudo every time
    ssh -t $ARBITER_DEPLOY_USER@$HOST_FQDN "/usr/bin/sudo bash -c 'sh /tmp/deploy-$HASH.sh $BUILD-bundle.tar.gz $PROJ; rm -f /tmp/deploy*'"
  fi

  # cleanup
  rm -rf /tmp/$BUILD*
}

if [[ ! -d "projects/$1" && $1 != "all" ]]; then
  echo "could not find 'projects/$1'. invalid project name, exiting..."
  usage
  exit -1
fi

if [ -z "$2" ]; then
  echo "Branch name must be populated, exiting..."
  usage
  exit -1
fi

if [[ -z "$3" || ($3 != "staging" && $3 != "dev" && $3 != "production") ]]; then
  echo "Invalid env, exiting..."
  usage
  exit -1
fi

if [[ -z "$4" && ($1 != "all")]]; then
  echo "Host must be populated, exiting..."
  usage
  exit -1
fi

if [ -z "$ARBITER_DEPLOY_USER" ]; then
  echo "ARBITER_DEPLOY_USER must be specified in your environment, exiting..."
  exit -1
fi

AWS_PROFILE=$3

# get sudo pw for future use
if [[ $5 == "yolo" ]]; then
  read -s -p "[sudo] password for $ARBITER_DEPLOY_USER: " SUDO_PASS
  echo ""
fi

if [ $1 == "all" ]; then
  ALL_PROJECTS=$(ls -1 projects/)

  for _PROJ in $ALL_PROJECTS; do
    echo "looking up servers to deploy $_PROJ"
    DEPLOY_HOSTS=$(node $PARENT_PATH/servers-matching.js $_PROJ)

    if [ ! -z "$DEPLOY_HOSTS" ]; then
      echo "$DEPLOY_HOSTS" | while read -r DEPLOY_HOST; do
        echo "_deploying $_PROJ $2 $3 $DEPLOY_HOST"
        _deploy $_PROJ $2 $3 $DEPLOY_HOST $5
      done
    else
      echo "No servers found to deploy $_PROJ"
    fi

    echo ""

    unset DEPLOY_HOSTS
  done
else
  echo "_deploying $1 $2 $3 $4"
  _deploy $1 $2 $3 $4 $5
fi
