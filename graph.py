import networkx as nx
import pandas as pd 
import matplotlib.pyplot as plt 
import scipy as sp
import csv

#Creating a graph to store the values 
G = nx.Graph()

#Reading data from the CSV file using pandas
data = pd.read_csv('fullerton.csv')

# Iterate through the rows of the DataFrame and add edges to the graph
for index, row in data.iterrows():
    s_intersection, e_intersection, w = row
    w = float(w)
    G.add_edge(s_intersection, e_intersection, weight=w)


#Visualizing the graph 
pos = nx.kamada_kawai_layout(G, scale=1)  

#For Drawing nodes
nx.draw_networkx_nodes(G, pos, node_size=700, node_color='skyblue')

# Draw edges with labels
nx.draw_networkx_edges(G, pos)
labels = nx.get_edge_attributes(G, 'weight')
nx.draw_networkx_edge_labels(G, pos, edge_labels=labels, font_size=10)

# Draw labels (intersections) with specified font size
node_labels = {node: node for node in G.nodes()}
nx.draw_networkx_labels(G, pos, labels=node_labels, font_size=12, font_color='black', font_weight='bold')

plt.title("City Road Network")
plt.axis('off')  
plt.show()




