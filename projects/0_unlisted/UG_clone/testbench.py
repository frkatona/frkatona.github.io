def generate_html_from_chords(text):
    # Splitting the input text into lines for processing
    lines = text.split(r'\r\n')
    html_output = []

    for line in lines:
        # Checking if the line contains chords
        if '[ch]' in line:
            chords_line = ''
            lyrics_line = ''
            parts = line.split('[ch]')
            for part in parts:
                chord_and_lyric = part.split('[/ch]')
                if len(chord_and_lyric) == 2:
                    # Chord is present, split further into chord and lyric
                    chord, lyric = chord_and_lyric
                    chords_line += f'<span class="chord">{chord}</span>'
                    lyrics_line += f'<span class="lyric">{lyric}</span>'
                else:
                    # No chord in this part, it's all lyrics
                    lyrics_line += f'<span class="lyric">{chord_and_lyric[0]}</span>'

            # Add the constructed chords and lyrics lines to the HTML output
            html_output.append('<div class="line">')
            html_output.append('<div class="chords">')
            html_output.append(chords_line)
            html_output.append('</div>')
            html_output.append('<div class="lyrics">')
            html_output.append(lyrics_line)
            html_output.append('</div>')
            html_output.append('</div>')
        else:
            # The line does not contain chords, add it as a regular text line
            if line.strip():  # Avoid adding empty lines
                html_output.append(f'<div class="text-line">{line}</div>')

    # Joining all the HTML parts
    full_html = '\n'.join(html_output)
    return full_html

# Sample input from the text with chords and lyrics
sample_text = """
[ch]Am[/ch] [ch]C[/ch] [ch]Am[/ch]

[Verse 1]
[tab]  [ch]C[/ch]                 [ch]Am[/ch]
I heard there was a secret chord[/tab]
"""

# Convert the sample text to HTML
html_content = generate_html_from_chords(sample_text)
print(html_content)
