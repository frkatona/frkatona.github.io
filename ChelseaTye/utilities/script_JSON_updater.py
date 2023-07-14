import json
import os

def update_song_database(database_file, new_songs_file):
    # Check if database file is empty
    if os.stat(database_file).st_size == 0:
        songs = []
    else:
        with open(database_file, 'r') as f:
            songs = json.load(f)
    
    with open(new_songs_file, 'r') as f:
        new_songs = json.load(f)
    
    songs_dict = {song['title']: song for song in songs if 'title' in song}
    
    for new_song in new_songs:
        if 'title' in new_song:
            songs_dict[new_song['title']] = new_song
        else:
            print(f"A song in the new_songs file doesn't have a 'title' field: {new_song}")
    
    sorted_songs = sorted(songs_dict.values(), key=lambda song: song['title'])
    
    with open(database_file, 'w') as f:
        json.dump(sorted_songs, f, indent=4)

new_song = r'C:\Users\antho\OneDrive\Code\frkatona.github.io\ChelseaTye\utilities\lyrics_songExport.json'
song_total = r'C:\Users\antho\OneDrive\Code\frkatona.github.io\ChelseaTye\utilities\lyrics_library.json'
update_song_database(song_total, new_song) 