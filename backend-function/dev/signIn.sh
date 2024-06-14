#!/usr/bin/env bash

echo -n "Password (asdfasdf might be correct):"
read -s password
echo

# POST username and password to the server
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email": "tester@breedersdb.com", "password": "'$password'"}' \
  http://localhost:8090/sign-in
