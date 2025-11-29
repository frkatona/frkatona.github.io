import os
import re
from urllib.parse import unquote

def check_links(html_file, root_dir):
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all href and src attributes
    links = re.findall(r'(?:href|src)=["\']([^"\']+)["\']', content)
    
    print(f"Checking {len(links)} links in {html_file}...")
    
    broken_links = []
    working_links = []
    external_links = []

    for link in links:
        if link.startswith(('http', 'https', 'mailto', '#')):
            external_links.append(link)
            continue
            
        # Decode URL (e.g. %20 -> space)
        decoded_link = unquote(link)
        
        # Construct absolute path
        # Assuming links are relative to index.html
        full_path = os.path.normpath(os.path.join(root_dir, decoded_link))
        
        if os.path.exists(full_path):
            working_links.append(decoded_link)
        else:
            broken_links.append(decoded_link)

    print(f"\nFound {len(working_links)} working local links.")
    print(f"Found {len(broken_links)} broken local links.")
    print(f"Found {len(external_links)} external/anchor links (skipped).")

    if broken_links:
        print("\nBroken Links:")
        for link in broken_links:
            print(f"  - {link}")
    else:
        print("\nAll local links are valid!")

if __name__ == "__main__":
    root = r"s:\S Creative\Code\WebDevScratch\GPT_Github\frkatona.github.io"
    index = os.path.join(root, "index.html")
    check_links(index, root)
