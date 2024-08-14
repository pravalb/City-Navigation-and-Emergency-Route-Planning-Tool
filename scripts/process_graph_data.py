import pandas as pd

# Load the nodes CSV file into a DataFrame
nodes_df = pd.read_csv('../data/nodes.csv')

# Load the edges CSV file into another DataFrame
edges_df = pd.read_csv('../data/edges.csv')

# Extract unique node IDs from the "nodes" DataFrame
unique_node_ids = set(nodes_df['id'])

# Filter the "edges" DataFrame to keep only valid edges
filtered_edges_df = edges_df[edges_df['node1'].isin(unique_node_ids) & edges_df['node2'].isin(unique_node_ids)]

# Extract unique node IDs from the filtered "edges" DataFrame
unique_node_ids_in_edges = set(filtered_edges_df['node1']).union(set(filtered_edges_df['node2']))

# Filter the "nodes" DataFrame to keep only nodes represented in the edges
filtered_nodes_df = nodes_df[nodes_df['id'].isin(unique_node_ids_in_edges)]

# Calculate the weight for each edge using geographical differences
def calculate_weight(row):
    node1 = filtered_nodes_df.loc[filtered_nodes_df['id'] == row['node1']]
    node2 = filtered_nodes_df.loc[filtered_nodes_df['id'] == row['node2']]
    lat_diff = abs(node1['lat'].values[0] - node2['lat'].values[0])
    lon_diff = abs(node1['lon'].values[0] - node2['lon'].values[0])
    return lat_diff + lon_diff

# Calculate weights
filtered_edges_df['weight'] = filtered_edges_df.apply(calculate_weight, axis=1)

# Multiply the 'weight' values by 100,000 to obtain integers
filtered_edges_df['normalized_weight'] = (filtered_edges_df['weight'] * 100000).astype(int)

# If you want to save the filtered "nodes" and "edges" DataFrames to new CSV files:
filtered_nodes_df.to_csv('../data/processed_nodes.csv', index=False)
filtered_edges_df.to_csv('../data/processed_edges.csv', index=False)
