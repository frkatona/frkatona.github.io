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

def replace_unicode(filename):
    with open(filename, 'r') as file:
        text = file.read()

    corrected_text = text.replace(r'\u00e2\u20ac\u2122', "'")

    with open(filename, 'w', encoding='utf-8') as file:
        file.write(corrected_text)

def replace_spaces(filename):
    with open(filename, 'r') as file:
        text = file.read()

    corrected_text = text.replace(r'""', '"-----"')

    with open(filename, 'w', encoding='utf-8') as file:
        file.write(corrected_text)

filename_in = r'ChelseaTye\utilities\plaintext_song_input.txt'
filename_out = r'ChelseaTye\utilities\lyrics_songExport.json'

song = parse_song(filename_in)
write_to_json(song, filename_out)
replace_unicode(filename_out)
replace_spaces(filename_out)