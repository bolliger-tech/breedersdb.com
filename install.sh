#!/usr/bin/env bash

set -e

# get containers ready
docker-compose pull
docker-compose build app nodev2

# install dependencies
docker-compose run app composer install
docker-compose run nodev1 npm install
docker-compose run nodev2 sh -c 'yarn && quasar build'

# initialize database
docker-compose run app bin/cake bake migrations migrate --no-lock
docker-compose run app bin/cake bake migrations migrate --no-lock --connection test

# start up containers
docker-compose up -d
