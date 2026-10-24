# Party gameshow stories

Eight fictional story outlines, divided evenly into two banks. Team pages have
four outlines each and no navigation to the other bank.

After this folder is published to GitHub Pages:

- Host: https://frkatona.github.io/projects/gameshow/
- Bank A: https://frkatona.github.io/projects/gameshow/bank-a.html
- Bank B: https://frkatona.github.io/projects/gameshow/bank-b.html

On the host page, choose **Show Bank A QR code** or **Show Bank B QR code**
to display one large code at a time. Each code goes directly to that bank.
Use the Back link to switch teams. The PNGs are also downloadable, and printing
the host page produces one QR code per page.

The QR codes encode the published URLs above. Scanning them requires these files
to be deployed; a local preview does not publish them. The pages are public links,
so keeping the banks separate is a party convenience rather than access control.

## Editing stories

Edit `stories.md`, keeping four top-level stories under each bank heading. One
tab marks a story beat; two tabs mark supporting details. Rebuild the static pages
and QR images with:

```powershell
python -m pip install "qrcode[pil]"
python projects/gameshow/build.py
```

The generated pages work on GitHub Pages without a build step, JavaScript, or
external services. `style.css` is shared by all three pages. If the hosting URL
changes, update `BASE_URL` in `build.py` and rebuild the QR codes.
