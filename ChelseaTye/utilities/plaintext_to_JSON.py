import json
import re

def parse_song(filename):
    with open(filename, 'r') as file:
        lines = file.readlines()
    
    song = {}
    song['title'] = lines[0].split(': ')[1].strip()
    song['key'] = lines[1].split(': ')[1].strip()
    song['sections'] = []
    
    current_section = None
    current_lines = []

    for line in lines[2:]:
        line = line.strip()
        if line == '':
            if current_section is not None:
                song['sections'].append({'name': current_section, 'lines': current_lines})
                current_lines = []
            continue
        if 'Verse' in line or 'Chorus' in line:
            current_section = line
            continue

        line_content = []
        for chord, phrase in re.findall('\((.*?)\)([^()]*)', line):
            words = phrase.split()
            line_content.append({'word': ' '.join(words), 'chord': chord})
        current_lines.append(line_content)

    if current_section is not None:
        song['sections'].append({'name': current_section, 'lines': current_lines})
    
    return song

def write_to_json(song, filename):
    with open(filename, 'w') as file:
        json.dump(song, file, indent=2)


filename_in = r'ChelseaTye\utilities\input.txt'
filename_out = r'ChelseaTye\utilities\output.json'

song = parse_song(filename_in)
write_to_json(song, filename_out)