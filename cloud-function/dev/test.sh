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
echo "Uploading attachments..."

attachment_dir=$(mktemp -d)

# usage: upload_attachment <file> <x-file-name> [<x-file-hash>]
# prints the http status, the response body is written to $attachment_dir/response
function upload_attachment() {
  local hash=${3:-$(shasum -a 256 "$1" | cut -d' ' -f1)}
  curl -X POST \
    -sS \
    -o "$attachment_dir/response" \
    -w '%{http_code}' \
    -H "Content-Type: application/octet-stream" \
    -H "Cookie: breedersdb.id.token=$token; breedersdb.user=$user" \
    -H "x-file-hash: $hash" \
    -H "x-file-name: $2" \
    --data-binary @"$1" \
    http://localhost/api/assets/upload-attachment
}

function fail() {
  echo "$1"
  rm -r "$attachment_dir"
  exit 1
}

# usage: expect_attachment_download <file> <file-param> <display-name> <content-type> <disposition>
function expect_attachment_download() {
  local status
  status=$(curl -sS \
    -o "$attachment_dir/download" \
    -D "$attachment_dir/headers" \
    -w '%{http_code}' \
    "http://localhost:8090/attachments/$3?file=$2")
  [[ "$status" == "200" ]] || fail "Download of $2 failed with status $status"
  cmp -s "$1" "$attachment_dir/download" || fail "Downloaded $2 differs from the upload"
  grep -qix "content-type: $4"$'\r' "$attachment_dir/headers" ||
    fail "Unexpected content type for $2 (expected $4): $(cat "$attachment_dir/headers")"
  grep -qi "^content-disposition: $5;" "$attachment_dir/headers" ||
    fail "Unexpected content disposition for $2 (expected $5): $(cat "$attachment_dir/headers")"
  grep -qix "x-content-type-options: nosniff"$'\r' "$attachment_dir/headers" ||
    fail "Missing nosniff for $2"
  grep -qi "^cache-control: .*immutable" "$attachment_dir/headers" ||
    fail "Missing immutable cache control for $2"
  echo "Download OK: $2 ($4, $5)"
}

# usage: <extension>|<expected content type>|<expected disposition>
attachment_cases=(
  "pdf|application/pdf|inline"
  "PNG|image/png|inline"
  "txt|text/plain; charset=utf-8|inline"
  "html|application/octet-stream|attachment"
  "csv|application/octet-stream|attachment"
  "svg|application/octet-stream|attachment"
  "xml|application/octet-stream|attachment"
)
for attachment_case in "${attachment_cases[@]}"; do
  IFS='|' read -r ext content_type disposition <<< "$attachment_case"
  ext_lower=$(echo "$ext" | tr '[:upper:]' '[:lower:]')
  file="$attachment_dir/upload.$ext"
  echo "smoke attachment $ext $(date +%s%N)" > "$file"
  hash=$(shasum -a 256 "$file" | cut -d' ' -f1)

  status=$(upload_attachment "$file" "Smoke%20File.$ext")
  [[ "$status" == "200" ]] || fail "Upload of .$ext failed with status $status: $(cat "$attachment_dir/response")"
  file_name=$(jq -r .fileName "$attachment_dir/response")
  [[ "$file_name" == "$hash.$ext_lower" ]] || fail "Unexpected fileName for .$ext: $file_name"
  url=$(jq -r .url "$attachment_dir/response")
  [[ "$url" == "/api/assets/attachments/$file_name?file=$file_name" ]] || fail "Unexpected url for .$ext: $url"

  expect_attachment_download "$file" "$file_name" "Smoke%20File.$ext_lower" "$content_type" "$disposition"
done

echo "Checking attachment download filename..."
grep -qiF "content-disposition: attachment; filename=\"Smoke File.xml\"; filename*=UTF-8''Smoke%20File.xml" "$attachment_dir/headers" ||
  fail "Unexpected content disposition: $(cat "$attachment_dir/headers")"
curl -sS -o /dev/null -D "$attachment_dir/headers" "http://localhost:8090/attachments/..%2F%C3%A4%22%0A.pdf?file=$file_name"
grep -qiF "content-disposition: attachment; filename=\"..__.pdf\"; filename*=UTF-8''..%C3%A4%22.pdf" "$attachment_dir/headers" ||
  fail "Display name not sanitized: $(cat "$attachment_dir/headers")"
echo "Filename OK."

echo "Uploading attachments without a valid extension..."
file="$attachment_dir/upload"
echo "smoke attachment no extension $(date +%s%N)" > "$file"
hash=$(shasum -a 256 "$file" | cut -d' ' -f1)
for name in "README" "smoke.p-f" "smoke.abcdefghijk" "smoke."; do
  status=$(upload_attachment "$file" "$name")
  [[ "$status" == "200" ]] || fail "Upload of $name failed with status $status"
  [[ $(jq -r .fileName "$attachment_dir/response") == "$hash" ]] ||
    fail "Unexpected fileName for $name: $(cat "$attachment_dir/response")"
done
expect_attachment_download "$file" "$hash" "README" "application/octet-stream" "attachment"

echo "Uploading a 10MB attachment..."
file="$attachment_dir/max.bin"
{ date +%s%N; head -c $((10 * 1024 * 1024)) /dev/zero; } | head -c $((10 * 1024 * 1024)) > "$file"
status=$(upload_attachment "$file" "max.bin")
[[ "$status" == "200" ]] || fail "10MB upload failed with status $status"
echo "10MB attachment accepted."

echo "Uploading a too large attachment..."
file="$attachment_dir/too-large.bin"
head -c $((10 * 1024 * 1024 + 1)) /dev/zero > "$file"
status=$(upload_attachment "$file" "too-large.bin")
[[ "$status" == "400" ]] || fail "Too large upload was not rejected: $status"
echo "Too large attachment rejected."

echo "Uploading an attachment with a wrong hash..."
status=$(upload_attachment "$attachment_dir/upload" "smoke.pdf" "$(printf '0%.0s' {1..64})")
[[ "$status" == "400" ]] || fail "Hash mismatch was not rejected: $status"
echo "Hash mismatch rejected."

echo "Uploading an attachment without authentication..."
status=$(curl -X POST -sS -o /dev/null -w '%{http_code}' --data-binary @"$attachment_dir/upload" http://localhost/api/assets/upload-attachment)
[[ "$status" == "401" ]] || fail "Unauthenticated upload was not rejected: $status"
echo "Unauthenticated upload rejected."

echo "Downloading invalid attachments..."
status=$(curl -sS -o /dev/null -w '%{http_code}' "http://localhost/api/assets/attachments/x.pdf?file=$(printf 'f%.0s' {1..64}).pdf")
[[ "$status" == "404" ]] || fail "Missing attachment did not return 404: $status"
for file_param in "..%2F$hash" "attachments%2F$hash" "$hash.PDF" "$hash.p-f" ""; do
  status=$(curl -sS -o /dev/null -w '%{http_code}' "http://localhost/api/assets/attachments/x?file=$file_param")
  [[ "$status" == "400" ]] || fail "Invalid file parameter '$file_param' did not return 400: $status"
done
echo "Invalid attachment downloads rejected."

rm -r "$attachment_dir"

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
