import React, { useState, useEffect, useRef } from 'react';
import { Network, DataSet } from 'vis-network/standalone/esm/vis-network';
import L from "leaflet";
import { MapContainer } from "react-leaflet/MapContainer";
import { TileLayer } from "react-leaflet/TileLayer";
import { Marker } from "react-leaflet/Marker";
import { Popup } from "react-leaflet/Popup";
import { Polyline } from "react-leaflet/Polyline";
import "leaflet/dist/leaflet.css";
import { useMapEvents } from 'react-leaflet/hooks'
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DirectionsIcon from '@mui/icons-material/Directions';
import RemoveRoadIcon from '@mui/icons-material/RemoveRoad';
import RefreshIcon from '@mui/icons-material/Refresh';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Drawer from '@mui/material/Drawer';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

export default function App() {
  const [display, setDisplay] = useState('map');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [pathNodes, setPathNodes] = useState([]);
  const [pathEdges, setPathEdges] = useState([]);
  const [isPolylineShown, setIsPolylineShown] = useState(false);

  const handleChange = (event, newDisplay) => {
    setDisplay(newDisplay);
  };

  const findShortestPath = async (event) => {
    // const response = await fetch(`/api/path?` + new URLSearchParams({ startNode: 122720994, endNode: 122920632 }))
    const response = await fetch(`/api/path?` + new URLSearchParams({ 
      lat1: markers[0].lat, 
      lon1: markers[0].lng,
      lat2: markers[1].lat, 
      lon2: markers[1].lng
    }))
      .then(response => response.json());
    console.log("response:", response);
    const newMarkers = response.shortestPath.nodes.map(node => ({lat: node.lat, lon: node.lon}));

    setMarkers(newMarkers);
    setPathNodes(response.shortestPath.nodes);
    setPathEdges(response.shortestPath.edges);
    setIsPolylineShown(true);
  }

  const LocationMarkers = () => {
    const map = useMapEvents({
      click(e) {
        const newMarkers = JSON.parse(JSON.stringify(markers));
        newMarkers.push(e.latlng);
        setMarkers(newMarkers);
      }
    })

    return (
      <div>
        {isPolylineShown && <Polyline positions={markers} />}
        {  
          markers.map((position, index) => {
            return (
              <Marker key={`marker-${index}`} position={position}>
                <Popup>
                  {`latitude: ${position.lat}, longitude: ${position.lng || position.lon}`}
                </Popup>
              </Marker>
            );
          })
        }
      </div>
    );
  }

  const list = () => (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={() => setIsDrawerOpen(false)}
      onKeyDown={() => setIsDrawerOpen(false)}
    >
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={findShortestPath}>
            <ListItemIcon>
              <DirectionsIcon />
            </ListItemIcon>
            <ListItemText primary="Find Shortest Path" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={(event) => {console.log("Simulate Blockage")}}>
            <ListItemIcon>
              <RemoveRoadIcon />
            </ListItemIcon>
            <ListItemText primary="Simulate Blockage" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={event => setMarkers([]) && setIsPolylineShown(false)}>
            <ListItemIcon>
              <RefreshIcon />
            </ListItemIcon>
            <ListItemText primary="Reset" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  const Graph = (intersections, streets) => {
    const containerRef = useRef(null);
  
    useEffect(() => {
      // Initialize vis.js options and data
      const nodes = new DataSet();
      pathNodes.forEach(node => nodes.update({id: node.id, label: `latitude: ${node.lat}, longitude: ${node.lon}`}))
      const edges = new DataSet();
      pathEdges.forEach(edge => edges.update({id: edge.id, to: edge.node2, from: edge.node1, label: edge.weight }))

      const data = { nodes, edges };
      const options = { /* Your options here */ };
  
      // Create the network
      const network = new Network(containerRef.current, data, options);
    }, []);
  
    return <div ref={containerRef} style={{ width: '100vw', height: '100vh' }}></div>;
  }

  return (
    <Container disableGutters maxWidth={false}>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar color='primary'>
          <Toolbar>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
              onClick={() => setIsDrawerOpen(true)}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
             City Navigation and Emergency Route Planning Tool
            </Typography>
            <ToggleButtonGroup
              color="secondary"
              value={display}
              exclusive
              onChange={handleChange}
            >
              <ToggleButton value="map">Map</ToggleButton>
              <ToggleButton value="graph">Graph</ToggleButton>
            </ToggleButtonGroup>
            <Drawer color='primary' open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
              {list()}
            </Drawer>
          </Toolbar>
        </AppBar>
      </Box>

      {
        {
          'map': 
            <MapContainer
              center={[33.8834, -117.885]}
              zoom={15}
              scrollWheelZoom={false}
              style={{ width: "100vw", height: "100vh" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarkers />
            </MapContainer>,
          'graph': <Graph />
        }[display]
      }
    </Container>
  );
}
