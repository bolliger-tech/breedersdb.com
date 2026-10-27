#!/usr/bin/env bash

set -euo pipefail

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
  --fail-with-body \
  -sS \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation SignIn {SignIn(email: \"'$email'\", password: \"'$password'\") {id}}"}' \
  -i \
  http://localhost/api/hasura/v1/graphql)

# Extract token and user from the response headers
token=$(echo "$response" | grep -i 'Set-Cookie: breedersdb.id.token=' | awk -F'=' '{print $2}' | awk -F';' '{print $1}')
user=$(echo "$response" | grep -i 'Set-Cookie: breedersdb.user=' | awk -F'=' '{print $2}' | awk -F';' '{print $1}')

if [ -z "$token" ]; then
  echo "Error: No token received from the server"
  echo "Response: $response"
else
  echo "Received token: $token"
fi

echo "Trying to run a query with the token..."

# run graphql query
curl -X POST \
  --fail-with-body \
  -sS \
  -H "Content-Type: application/json" \
  -H "Cookie: breedersdb.id.token=$token; breedersdb.user=$user" \
  -d '{"query":"query GetCrossings {crossings {id name created}}"}' \
  http://localhost/api/hasura/v1/graphql

echo
echo "Me"

curl -X POST \
  --fail-with-body \
  -sS \
  -H "Content-Type: application/json" \
  -H "Cookie: breedersdb.id.token=$token; breedersdb.user=$user" \
  -d '{"query":"query Me {Me {id user{id email locale created}}}"}' \
  http://localhost/api/hasura/v1/graphql

# test personal access token
echo
echo "Creating Personal Access Token..."

pat_name="test-$(date +%s)"
response=$(curl -X POST \
  --fail-with-body \
  -sS \
  -H "Content-Type: application/json" \
  -H "Cookie: breedersdb.id.token=$token; breedersdb.user=$user" \
  -d '{"query":"mutation CreatePersonalAccessToken {CreatePersonalAccessToken(object: {name: \"'$pat_name'\"}) { token }}"}' \
  http://localhost/api/hasura/v1/graphql
)

pat=$(echo "$response" | jq .data.CreatePersonalAccessToken.token | sed 's/"//g')

echo
echo "Testing Personal Access Token"

curl -X POST \
  --fail-with-body \
  -sS \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $pat" \
  -d '{"query":"query Me {Me {id user{id email locale created}}}"}' \
  http://localhost/api/hasura/v1/graphql

echo
echo "Deleting Personal Access Token..."

response=$(curl -X POST \
  --fail-with-body \
  -sS \
  -H "Content-Type: application/json" \
  -H "Cookie: breedersdb.id.token=$token; breedersdb.user=$user" \
  -d '{"query":"mutation DeletePersonalAccessToken {delete_user_tokens(where: {name: {_eq: \"'$pat_name'\"}, type: {_eq: \"pat\"}}) {affected_rows}}"}' \
  http://localhost/api/hasura/v1/graphql
)

affected_rows=$(echo "$response" | jq -r '.data.delete_user_tokens.affected_rows // 0')
if [[ "$affected_rows" -gt 0 ]]; then
  echo "Personal Access Token deleted successfully."
else
  echo "Failed to delete Personal Access Token."
  exit 1
fi

echo
echo "Uploading image..."

image="$(dirname "$0")/smoke.jpg"
image_hash=$(shasum -a 256 "$image" | cut -d' ' -f1)
response=$(curl -X POST \
  --fail-with-body \
  -sS \
  -H "Content-Type: image/jpeg" \
  -H "Cookie: breedersdb.id.token=$token; breedersdb.user=$user" \
  -H "x-file-hash: $image_hash" \
  -H "x-file-name: smoke.jpg" \
  --data-binary @"$image" \
  http://localhost/api/assets/upload
)
echo "$response"
image_url=$(echo "$response" | jq -r .url)

echo
echo "Downloading resized image..."

# 100px is not a cachable dimension, so sharp resizes on every request
resized=$(mktemp)
curl --fail-with-body -sS -o "$resized" "http://localhost${image_url}&width=100"
resized_info=$(file -b "$resized")
rm "$resized"
if [[ "$resized_info" == *"100x75"* ]]; then
  echo "Resized image OK: $resized_info"
else
  echo "Unexpected resized image: $resized_info"
  exit 1
fi

echo
echo "Trying to sign out..."

# sign out
curl -X POST \
  --fail-with-body \
  -sS \
  -H "Content-Type: application/json" \
  -H "Cookie: breedersdb.id.token=$token; breedersdb.user=$user" \
  -d '{"query":"mutation SignOut {SignOut {user_id}}"}' \
  http://localhost/api/hasura/v1/graphql

echo
echo
echo "Resetting password..."

last_mail_id=$(curl -sS "http://localhost:8025/api/v1/search?query=to:$email&limit=1" | jq -r '.messages[0].ID // empty')

curl -X POST \
  --fail-with-body \
  -sS \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation SendPasswordResetMail {SendPasswordResetMail(email: \"'$email'\") {id}}"}' \
  http://localhost/api/hasura/v1/graphql
echo

mail_id=""
for _ in {1..20}; do
  mail_id=$(curl -sS "http://localhost:8025/api/v1/search?query=to:$email&limit=1" | jq -r '.messages[0].ID // empty')
  if [[ -n "$mail_id" && "$mail_id" != "$last_mail_id" ]]; then
    break
  fi
  sleep 0.5
done
if [[ -z "$mail_id" || "$mail_id" == "$last_mail_id" ]]; then
  echo "No password reset mail received (check mailpit at http://localhost:8025)"
  exit 1
fi

reset_token=$(curl -sS "http://localhost:8025/api/v1/message/$mail_id" | jq -r .Text | grep -o 'token=[A-Za-z0-9._-]*' | head -1 | cut -d= -f2)

echo "Trying a tampered reset token..."
response=$(curl -X POST \
  --fail-with-body \
  -sS \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation ResetPassword {ResetPassword(newPassword: \"'$password'\", token: \"'${reset_token}x'\") {id}}"}' \
  http://localhost/api/hasura/v1/graphql
)
if [[ $(echo "$response" | jq -r '.errors[0].extensions.code // empty') != "401" ]]; then
  echo "Tampered token was not rejected: $response"
  exit 1
fi
echo "Tampered token rejected."

# reset to the same password, so the test user stays usable
echo "Resetting password with the mailed token..."
curl -X POST \
  --fail-with-body \
  -sS \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation ResetPassword {ResetPassword(newPassword: \"'$password'\", token: \"'$reset_token'\") {id}}"}' \
  http://localhost/api/hasura/v1/graphql
echo
