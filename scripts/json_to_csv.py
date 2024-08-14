import json
import csv

# Input JSON file
mapdata_json = '../data/mapdata.json'

# Output CSV files
nodes_csv = '../data/nodes.csv'
edges_csv = '../data/edges.csv'

try:
    with open(mapdata_json, 'r') as json_file, open(edges_csv, 'w', newline='') as edge_csv_file, open(nodes_csv, 'w', newline='') as node_csv_file:
        # Load JSON data
        data = json.load(json_file)

        # Extract relevant data and write to CSV
        edge_csv_writer = csv.writer(edge_csv_file)
        node_csv_writer = csv.writer(node_csv_file)

        # Write header row
        edge_csv_writer.writerow(['id', 'name', 'node1', 'node2'])
        node_csv_writer.writerow(['id', 'lat', 'lon', 'traffic_signals', 'stop'])

        for element in data['elements']:
            print('type: ' + element['type'])
            element_type = element['type']
            print('id: ' + str(element['id']))
            element_id = str(element['id'])

            if element_type == 'way':
                street_name = ''

                if 'tags' in element and 'name' in element['tags']:
                    print('name: ' + element['tags']['name'])
                    street_name = element['tags']['name']

                    for i in range(len(element['nodes']) - 1):
                        print('node1: ' + str(element['nodes'][i]))
                        node1 = str(element['nodes'][i])
                        print('node2: ' + str(element['nodes'][i + 1]))
                        node2 = str(element['nodes'][i + 1])

                        edge_csv_writer.writerow([element_id + node1 + node2, street_name, node1, node2])
            elif element_type == 'node':
                traffic_signals = 'FALSE'
                stop = 'FALSE'

                if 'tags' in element and 'highway' in element['tags']:
                    if element['tags']['highway'] == 'traffic_signals':
                        traffic_signals = 'TRUE'
                    elif element['tags']['highway'] == 'stop':
                        stop = 'TRUE'

                print('lat: ' + str(element['lat']))
                element_lat = str(element['lat'])
                print('lon: ' + str(element['lon']))
                element_lon = str(element['lon'])

                node_csv_writer.writerow([element_id, element_lat, element_lon, traffic_signals, stop])

    print(f"Conversion completed. Results saved to {nodes_csv} and {edges_csv}")

except FileNotFoundError:
    print(f"JSON file not found: {mapdata_json}")
except Exception as e:
    print(f"An error occurred: {e}")