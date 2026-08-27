#!/bin/sh

# Run as download_inventory_report.sh username password http://127.0.0.1:8000 inventory_report.xlsx
# It will automatically authenticate with the Django API endpoint and download the inventory report.

LOGIN_USER=$1
LOGIN_PASS=$2
ENDPOINT=$3
OUTPUT_PATH=$4

LOGIN_RESULT=$(curl -s -X POST "$ENDPOINT/api/auth/login/" -H "Accept: application/json" -H "Content-Type: application/json" -d "{\"username\": \"$LOGIN_USER\", \"password\": \"$LOGIN_PASS\"}")
ACCESS_TOKEN=$(echo $LOGIN_RESULT | jq -r .access_token)
REFRESH_TOKEN=$(echo $LOGIN_RESULT | jq -r .refresh_token)

echo "ACCESS_TOKEN: $ACCESS_TOKEN"
echo "REFRESH TOKEN: $REFRESH_TOKEN"

curl "$ENDPOINT/api/projects/v2/export/?inventory_report=true" -H "Authorization: Bearer $ACCESS_TOKEN" -o $OUTPUT_PATH
