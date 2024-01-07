import json
import os

def transform_data(input_file):
    with open(input_file, 'r') as f:
        data = json.load(f)
    nodes = [{"id": item["chord"], "group": item["function"], "notes": item["notes"]} for item in data]
    links = []
    for item in data:
        for type, chords in item["next"][0].items():
            for chord in chords:
                link_id = f"{item['chord']}-{chord}"
                links.append({"id": link_id, "source": item["chord"], "target": chord, "value": 1, "type": type})
    output = {"nodes": nodes, "links": links}

    return output

def write_output(output, input_file):
    # use the output file path head and new string to create output file path without the previous tail
    output_file = 'Subpages\ChordNetwork\data\chordFlow-D3-copyboard.json'
    with open(output_file, 'w') as f:
        json.dump(output, f, indent=1)

    # Open the file again in read mode
    with open(output_file, 'r') as f:
        file_content = f.read()

    # # Print the file content
    # print(repr(file_content))

    # Modify the file content
    file_content = file_content.replace('{\n   ', '{')
    file_content = file_content.replace(',\n   ', ', ')
    file_content = file_content.replace('"\n  }', '"}')
    file_content = file_content.replace('"notes": [\n    ', '"notes": [')
    file_content = file_content.replace('\n   ]\n  ', ']')

    # Open the file again in write mode and overwrite it with the modified content
    with open(output_file, 'w') as f:
        f.write(file_content)

input_file = 'Subpages\ChordNetwork\data\chordFlow-pythonSeed.json'
output = transform_data(input_file)
write_output(output, input_file)