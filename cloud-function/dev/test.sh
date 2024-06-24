#!/usr/bin/env bash

echo -n "Email (empty for: tester@breedersdb.com):"
read email
if [ -z "$email" ]; then
  email="tester@breedersdb.com"
fi

echo -n "Password (empty for: Asdfasdf.1):"
read -s password
echo
if [ -z "$password" ]; then
  password="Asdfasdf.1"
fi

# POST username and password to the server
  #-d '{"email": "'$email'", "password": "'$password'"}' \
response=$(curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation SignIn {SignIn(email: \"'$email'\", password: \"'$password'\") {user_id}}"}' \
  -i \
  -s \
  http://localhost:8080/v1/graphql)

# Extract the token from the response headers
token=$(echo "$response" | grep -i 'Set-Cookie: breedersdb.id.token=' | awk -F'=' '{print $2}' | awk -F';' '{print $1}')

if [ -z "$token" ]; then
  echo "Error: No token received from the server"
  echo "Response: $response"
else
  echo "Received token: $token"
fi

echo "Trying to run a query with the token..."

# run graphql query
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Cookie: breedersdb.id.token=$token" \
  -d '{"query":"query GetCrossings {crossings {id name created}}"}' \
  http://localhost:8080/v1/graphql

echo
echo "Me"

curl -X POST \
  -H "Content-Type: application/json" \
  -H "Cookie: breedersdb.id.token=$token" \
  -d '{"query":"query Me {Me {id user{id email locale created}}}"}' \
  http://localhost:8080/v1/graphql


echo
echo "Trying to sign out..."

# sign out
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Cookie: breedersdb.id.token=$token" \
  -d '{"query":"mutation SignOut {SignOut {user_id}}"}' \
  http://localhost:8080/v1/graphql
