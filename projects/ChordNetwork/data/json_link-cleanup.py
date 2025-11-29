import json

# Function to calculate new chord names based on the rule provided
def calculate_new_chords(rootNote, rule):
    chord_names = ["I", "ii", "iii", "IV", "V", "vi", "viio", "II", "bIII", "III", "iv", "v", "bVI", "bVII"]
    new_chords = []
    adjustments = {
        "second": [1, 2],
        "third": [0, 3, 4],
        "fourth": [5, 6]
    }
    for adjustment in adjustments[rule]:
        higher_note = (rootNote + adjustment) % 12
        lower_note = (rootNote - adjustment + 12) % 12
        if higher_note < len(chord_names):
            new_chords.append(chord_names[higher_note])
        if lower_note < len(chord_names):
            new_chords.append(chord_names[lower_note])
    return new_chords

# Path to the JSON file containing the original chord data
file_path = 'Subpages\ChordNetwork\data\chordFlow-pythonSeed.json'

# Reading and processing the JSON file
with open(file_path, 'r') as file:
    chords_data = json.load(file)

for chord in chords_data:
    rootNote = chord["notes"][0]
    chord["next"][0]["second"] = calculate_new_chords(rootNote, "second")
    chord["next"][0]["third"] = calculate_new_chords(rootNote, "third")
    chord["next"][0]["fourth"] = calculate_new_chords(rootNote, "fourth")

# Saving the updated JSON data to a file
updated_file_path = r'Subpages\ChordNetwork\data\updated_chordFlow.json'
with open(updated_file_path, 'w') as updated_file:
    json.dump(chords_data, updated_file, indent=4)

print(f"Updated JSON data saved to {updated_file_path}")
