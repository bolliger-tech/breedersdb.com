#!/usr/bin/env bash

echo -n "Email (empty for: tester@breedersdb.com):"
read email
if [ -z "$email" ]; then
  email="tester@breedersdb.com"
fi

echo -n "Password (empty for: asdfasdf):"
read -s password
echo
if [ -z "$password" ]; then
  password="asdfasdf"
fi

# POST username and password to the server
response=$(curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email": "'$email'", "password": "'$password'"}' \
  -i \
  -s \
  http://localhost:8090/sign-in)

# Extract the token from the response headers
token=$(echo "$response" | grep -i 'Set-Cookie: token=' | awk -F'=' '{print $2}' | awk -F';' '{print $1}')

if [ -z "$token" ]; then
  echo "Error: No token received from the server"
else
  echo "Received token: $token"
fi

echo "Trying to run a query with the token..."

# run graphql query
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Cookie: token=$token" \
  -d '{"query":"query GetCrossings {crossings {id name created}}"}' \
  http://localhost:8080/v1/graphql
