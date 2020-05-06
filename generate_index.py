import os
import json
import gpxpy

directory = "trips"
data = []

for file in os.listdir(os.fsencode(directory)):
    filename = os.fsdecode(file)
    gpx_file = open(directory + "/" + filename, 'r')
    gpx = gpxpy.parse(gpx_file)

    for track in gpx.tracks:
        data.append({
            "name": track.name,
            "file": filename,
            "distance": int(track.length_3d())
        })

with open("static/index.json", "w") as outfile:
    json.dump(data, outfile, sort_keys=True, indent=4)
