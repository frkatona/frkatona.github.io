import requests
from bs4 import BeautifulSoup
import os

def extract_tabs(url):
    # Create the directory if it doesn't exist
    directory = 'Subpages/UG_clone/UG_jsons'
    if not os.path.exists(directory):
        os.makedirs(directory)

    # Extract artist and song name from URL
    parts = url.split('/')
    if len(parts) < 2:
        return "URL format is not as expected"
    
    artist = parts[-2]
    song_name = parts[-1]
    filename = f"{artist}_{song_name}.txt"

    # Send a request to the URL
    response = requests.get(url)
    response.raise_for_status()  # Ensure the request was successful

    # Parse the HTML content
    soup = BeautifulSoup(response.text, 'html.parser')

    # Find the div with class 'js-store'
    store_div = soup.find('div', class_='js-store')
    if not store_div:
        return "Div with class 'js-store' not found"

    # Convert the div content to string
    content_str = str(store_div)

    # Find the content between ' [ch]' and '[/tab]'
    start_idx = content_str.find(' [ch]')
    end_idx = content_str.rfind('[/tab]')
    if start_idx == -1 or end_idx == -1:
        return "Specified strings not found"

    # Extract the content
    extracted_content = content_str[start_idx:end_idx + len('[/tab]')]

    # Write to a text file in the specified directory
    file_path = os.path.join(directory, filename)
    with open(file_path, 'w') as file:
        file.write(extracted_content)

    return f"Content extracted successfully and saved as {file_path}"

# Example usage
url = 'https://tabs.ultimate-guitar.com/tab/jeff-buckley/hallelujah-chords-198052'
result = extract_tabs(url)
print(result)
