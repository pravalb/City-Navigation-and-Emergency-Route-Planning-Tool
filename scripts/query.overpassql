// Boundary Box defined as (lat_min,lon_min,lat_max,lon_max)
// [out:json][timeout:500][bbox:33.8438, -118.0076, 33.9349, -117.8416];
[out:json][timeout:500][bbox:33.87767, -117.87500, 33.88906, -117.89575];
// The public street network
way["highway"~"^(trunk|primary|secondary|tertiary|unclassified|residential)$"]->.streets;
// Get nodes that connect between three or more street segments
node(way_link.streets:3-)->.connections;
// Get intersections between distinct streets
foreach .connections->.connection(
// Get adjacent streets
way(bn.connection);
// If the names don't all match, add the node to the set of intersections
if (u(t["name"]) == "< multiple values found >") {
(.connection; .intersections;)->.intersections;
}
);
// Print intersections using
.intersections out;
// Print streets using
.streets out;