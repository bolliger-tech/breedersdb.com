#!/usr/bin/env bash

set -e

# get containers ready
docker-compose pull
docker-compose build app nodev2

# install dependencies
docker-compose run --user={GITHUB_DOCKER_USER:-www-data} app composer install --no-interaction
docker-compose run nodev1 npm install
docker-compose run --user={GITHUB_DOCKER_USER:-node} nodev2 yarn

# initialize database
docker-compose run app bin/cake migrations migrate --no-lock
docker-compose run app bin/cake migrations migrate --no-lock --connection test

# start up containers
docker-compose up -d
