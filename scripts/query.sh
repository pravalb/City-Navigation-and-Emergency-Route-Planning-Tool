#!/bin/bash

# Path to the file containing the Overpass QL query
QUERY_FILE="query.overpassql"

# Read the query from the file
QUERY=$(cat "$QUERY_FILE")

# Run the nodes query and save the JSON output to a file
curl -X POST -H "Content-Type: application/x-www-form-urlencoded" --data "data=${QUERY}.intersections out;" https://overpass-api.de/api/interpreter -o mapdata.json
echo "Query completed. Results saved to mapdata.json"