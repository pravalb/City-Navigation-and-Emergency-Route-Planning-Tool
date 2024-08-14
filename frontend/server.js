const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");

const app = express();

app.set("port", process.env.PORT || 4000);

// Express only serves static assets in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static("build"));
}

app.get("/api/path", (req, res) => {
  console.log("finding shortest path")
  let startNode = req.query.startNode;
  let endNode = req.query.endNode;
  const lat1 = parseFloat(req.query.lat1);
  const lon1 = parseFloat(req.query.lon1);
  const lat2 = parseFloat(req.query.lat2);
  const lon2 = parseFloat(req.query.lon2);
  console.log("lat1:", lat1)
  console.log("lon1:", lon1)
  console.log("lat2:", lat2)
  console.log("lon2:", lon2)

  // Function to find the closest node to a set of coordinates
  function findClosestNode(lat, lon, nodes) {
    let closestNodeId = null;
    let minDistance = Infinity;

    for (const nodeId in nodes) {
      const node = nodes[nodeId];
      const latDiff = node.lat - lat;
      const lonDiff = node.lon - lon;
      const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);

      if (distance < minDistance) {
        minDistance = distance;
        closestNodeId = nodeId;
      }
    }

    return closestNodeId;
  }

  // Read the CSV files and build the graph
  const nodes = {}; // Store nodes by ID
  const edges = {}; // Store edges by source node ID
  const graph = {};

  fs.createReadStream("../data/processed_nodes.csv")
    .pipe(csv())
    .on("data", (row) => {
      nodes[row.id] = { id: row.id, lat: parseFloat(row.lat), lon: parseFloat(row.lon) };
    })
    .on("end", () => {
      fs.createReadStream("../data/processed_edges.csv")
        .pipe(csv())
        .on("data", (row) => {
          edges[row.node1] = edges[row.node1] || [];
          edges[row.node1].push({
            id: row.id,
            node1: row.node1, // Include node1 in edge object
            node2: row.node2,
            weight: parseInt(row.normalized_weight),
          });
        })
        .on("end", () => {
          if (lat1 && lon1) {
            startNode = findClosestNode(lat1, lon1, nodes)
          }
        
          if (lat2 && lon2) {
            endNode = findClosestNode(lat2, lon2, nodes)
          }

          console.log("startNode", startNode)
          console.log("endNode", endNode)

          // Initialize the distance matrix with infinity values
          const numNodes = Object.keys(nodes).length;
          const dist = {};
          const next = {}; // To store the next node in the path
          for (const u in nodes) {
            dist[u] = {};
            next[u] = {};
            for (const v in nodes) {
              dist[u][v] = u === v ? 0 : Infinity;
              next[u][v] = null;
            }
          }

          // Update the distance matrix with direct edge weights and initialize the next matrix
          for (const u in nodes) {
            if (edges[u]) {
              edges[u].forEach((edge) => {
                const v = edge.node2;
                dist[u][v] = edge.weight;
                next[u][v] = v;
              });
            }
          }
          console.log("FW starting")
          // Floyd-Warshall algorithm to find shortest paths
          for (const k in nodes) {
            for (const i in nodes) {
              for (const j in nodes) {
                if (dist[i][k] + dist[k][j] < dist[i][j]) {
                  dist[i][j] = dist[i][k] + dist[k][j];
                  next[i][j] = next[i][k];
                }
              }
            }
          }
          console.log("startNode:", startNode)
          console.log("endNode:", endNode)
          if (startNode && endNode) {
            // Calculate the shortest path from startNode to endNode
            if (dist[startNode] && dist[startNode][endNode] !== Infinity) {
              const pathNodes = [startNode];
              const pathEdges = [];
              let currentNode = startNode;

              while (currentNode !== endNode) {
                const nextNode = next[currentNode][endNode];
                if (!nextNode) {
                  break;
                }

                pathNodes.push(nextNode);
                pathEdges.push(edges[currentNode].find((edge) => edge.node2 === nextNode));
                currentNode = nextNode;
              }

              res.json({
                startNode: nodes[startNode],
                endNode: nodes[endNode],
                shortestPath: {
                  nodes: pathNodes.map((nodeId) => nodes[nodeId]),
                  edges: pathEdges,
                },
              });
            } else {
              res.status(400).json({ error: "Invalid node IDs provided." });
            }
          } else if (!isNaN(lat1) && !isNaN(lon1) && !isNaN(lat2) && !isNaN(lon2)) {
            // Generate random start and end nodes if coordinates are not provided
            const nodeIds = Object.keys(nodes);
            const randomStartNode = nodeIds[Math.floor(Math.random() * nodeIds.length)];
            const randomEndNode = nodeIds[Math.floor(Math.random() * nodeIds.length)];

            if (dist[randomStartNode] && dist[randomStartNode][randomEndNode] !== Infinity) {
              const pathNodes = [randomStartNode];
              const pathEdges = [];
              let currentNode = randomStartNode;

              while (currentNode !== randomEndNode) {
                const nextNode = next[currentNode][randomEndNode];
                if (!nextNode) {
                  break;
                }

                pathNodes.push(nextNode);
                pathEdges.push(edges[currentNode].find((edge) => edge.node2 === nextNode));
                currentNode = nextNode;
              }

              res.json({
                startNode: nodes[randomStartNode],
                endNode: nodes[randomEndNode],
                shortestPath: {
                  nodes: pathNodes.map((nodeId) => nodes[nodeId]),
                  edges: pathEdges,
                },
              });
            } else {
              res.status(400).json({ error: "No valid path found between random nodes." });
            }
          } else {
            res.status(400).json({ error: "Invalid input provided." });
          }
        });
    });
});

app.listen(app.get("port"), () => {
  console.log(`Find the server at: http://localhost:${app.get("port")}/`);
});
