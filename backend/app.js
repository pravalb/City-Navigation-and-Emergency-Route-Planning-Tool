const http = require('http');
const url = require('url');
const fs = require('fs');
const Papa = require('papaparse');

const hostname = '127.0.0.1';
const port = 2999;

class Location {
    constructor(data) {
        this.id = data.id;
        this.lat = data.lat;
        this.lon = data.lon;
        this.traffic_signals = data.traffic_signals;
        this.stop = data.stop;
        this.edges = [];
    }

    addEdge(edge) {
        this.edges.push(edge);
    }

    calculateDistance(lat, lon) {
        if (this.lat == lat && this.lon == lon) {
            return 0; // Coordinates are the same, return 0.
        }

        const R = 6371; // Radius of the Earth in kilometers
        const lat1Rad = this.lat * (Math.PI / 180);
        const lat2Rad = lat * (Math.PI / 180);
        const latDiff = lat2Rad - lat1Rad;
        const lonDiff = (lon - this.lon) * (Math.PI / 180);

        const a = Math.sin(latDiff / 2) ** 2 + Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(lonDiff / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const distance = R * c; // The distance in kilometers
        return distance;
    }
}

class Edge {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.node1 = data.node1;
        this.node2 = data.node2;
        this.weight = data.weight;
        this.normalized_weight = data.normalized_weight;
        this.is_blocked = false;
    }
}

class Solution {
    constructor() {
        this.locations = [];
        this.edges = [];
    }

    addLocation(location) {
        this.locations.push(location);
    }

    addEdge(edge) {
        this.edges.push(edge);
        const node1 = this.locations.find((location) => location.id === edge.node1);
        const node2 = this.locations.find((location) => location.id === edge.node2);
        if (node1 && node2) {
            node1.addEdge(edge);
            node2.addEdge(edge);
        }
    }

    // Function to initialize and run the Floyd-Warshall algorithm
    floydWarshall(startNodeId, endNodeId, blockedEdges) {
        const distances = {}; // Store the shortest distances
        const nextNodes = {}; // Store the next nodes for constructing the path

        // Initialize distances and nextNodes based on the existing edges
        this.locations.forEach((location) => {
            distances[location.id] = {};
            nextNodes[location.id] = {};

            location.edges.forEach((edge) => {
                distances[location.id][edge.node1] = edge.normalized_weight;
                nextNodes[location.id][edge.node1] = edge.node2;
            });
        });

        this.locations.forEach((k) => {
            this.locations.forEach((i) => {
                this.locations.forEach((j) => {
                    if (
                        distances[i.id][k.id] !== undefined &&
                        distances[k.id][j.id] !== undefined &&
                        (!distances[i.id][j.id] || distances[i.id][k.id] + distances[k.id][j.id] < distances[i.id][j.id])
                    ) {
                        distances[i.id][j.id] = distances[i.id][k.id] + distances[k.id][j.id];
                        nextNodes[i.id][j.id] = nextNodes[i.id][k.id];
                    }
                });
            });
        });

        const jsonContent = JSON.stringify({distance: distances, nextNode: nextNodes}, null, 2); // The second argument is for pretty-printing (use 2 spaces for indentation)

        const filePath = 'floy.json';

        fs.writeFile(filePath, jsonContent, 'utf-8', (err) => {
            if (err) {
                console.error('Error saving JSON to file:', err);
            } else {
                console.log('JSON data has been saved to', filePath);
            }
        });

        const shortestPath = [];
        let currentNode = startNodeId;
        while (currentNode !== endNodeId) {
            if (nextNodes[currentNode][endNodeId] === undefined) {
                return {nodes: [], edges: []};
            }
            shortestPath.push(currentNode);
            currentNode = nextNodes[currentNode][endNodeId];
        }
        shortestPath.push(endNodeId);

        const pathEdges = [];
        for (let i = 0; i < shortestPath.length - 1; i++) {
            const node1 = shortestPath[i];
            const node2 = shortestPath[i + 1];
            const edge = this.edges.find(
                (e) =>
                    ((e.node1 === node1 && e.node2 === node2) || (e.node1 === node2 && e.node2 === node1)) &&
                    !e.is_blocked
            );
            if (edge) {
                pathEdges.push(edge);
            }
        }

        return {nodes: shortestPath, edges: pathEdges};
    }
}

const solution = new Solution();
fs.readFile('nodes.csv', 'utf8', (err, data) => {
    Papa.parse(data, {
        header: true, // Treat the first row as headers
        dynamicTyping: true, // Automatically detect data types
        complete: function (results) {
            const jsonData = results.data;
            jsonData.forEach((location) => {
                solution.addLocation(new Location(location));
            })
        },
        error: function (error) {
            console.error("CSV parsing error: " + error.message);
        }
    });
})

fs.readFile('processed_edges.csv', 'utf8', (err, data) => {
    Papa.parse(data, {
        header: true, // Treat the first row as headers
        dynamicTyping: true, // Automatically detect data types
        complete: function (results) {
            const jsonData = results.data;
            jsonData.forEach((edge) => {
                solution.addEdge(new Edge(edge));
            })
        },
        error: function (error) {
            console.error("CSV parsing error: " + error.message);
        }
    });
})

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true); // Parse the URL and handle query parameters
    const {pathname, query} = parsedUrl;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (pathname == '/locations') {
        let data = '';
        req.on('data', (chunk) => {
            // Collect the data from the request body
            data += chunk;
        });

        req.on('end', () => {
            const jsonData = JSON.parse(data);

            const lon = jsonData.lon;
            const lat = jsonData.lat;

            let shortedDistance = Infinity;
            let closestNode = null;

            solution.locations.forEach((location) => {
                const distance = location.calculateDistance(lat, lon);
                if (distance < shortedDistance) {
                    shortedDistance = distance;
                    closestNode = location;
                }
            })

            return res.end(JSON.stringify({
                data: {
                    "id": closestNode.id,
                    "lat": closestNode.lat,
                    "lon": closestNode.lon,
                    "traffic_signals": closestNode.traffic_signals,
                    "stop": closestNode.stop
                }
            }))
        })

    } else if (pathname == '/routes') {
        let data = '';
        req.on('data', (chunk) => {
            // Collect the data from the request body
            data += chunk;
        });

        req.on('end', () => {
            try {
                const jsonData = JSON.parse(data);

                const startId = jsonData.start;
                const endId = jsonData.end;
                const blockedEdges = jsonData.blockedEdges;

                // 1. parse startId and endId from json
                // 2. i have to block the edges that are blocked
                // 3. then i have to run floyd warshall on the graph
                // 4. then i have to return the path which includes all the nodes that are in the path, and the edges involved with the path

                const graphs = [];
                solution.locations.forEach((location) => {
                    graphs.push(location.edges.map((edge) => edge.is_blocked ? undefined : edge.normalized_weight));
                })

                const result = solution.floydWarshall(startId, endId, blockedEdges)

                res.statusCode = 200;
                res.end(JSON.stringify({
                    data: {
                        start: startId,
                        end: endId,
                        nodes: result.nodes,
                        edges: result.edges
                    }
                }));

            } catch (error) {
                // Handle parsing errors
                console.log(error)
                res.writeHead(400, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({error: 'Invalid JSON data'}));
            }
        });
    } else {
        res.statusCode = 404;
        res.end(JSON.stringify({error: 'Not Found'}));
    }
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
