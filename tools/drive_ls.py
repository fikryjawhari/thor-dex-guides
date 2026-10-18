"""List (and optionally download) a public Google Drive folder via its embedded view.
Usage: python -I drive_ls.py <folder-id> [out-dir]
Prints id, kind and name per entry; with out-dir, downloads every file entry
(Google Sheets as .xlsx, Google Docs as .txt). Subfolders are listed, not walked,
and archives (patches, emulators) are skipped.
The normal folder page only renders the first ~10 entries; the embedded view lists all."""
import html, os, re, sys, urllib.request

UA = {"User-Agent": "Mozilla/5.0"}
ARCHIVES = (".zip", ".rar", ".7z", ".xdelta", ".bps", ".ips")


def get(url):
    resp = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=300)
    return resp.read(), resp.headers.get("Content-Disposition", "")


def entries(folder):
    page = get("https://drive.google.com/embeddedfolderview?id=" + folder)[0].decode("utf-8", "replace")
    pat = r'href="https://(?:drive|docs)\.google\.com/(file|drive/folders|spreadsheets|document|presentation)/(?:d/)?([\w-]+).*?flip-entry-title">([^<]+)'
    for kind, fid, name in re.findall(pat, page, re.S):
        yield kind.split("/")[-1], fid, html.unescape(name)


def export_url(kind, fid):
    if kind == "spreadsheets":
        return f"https://docs.google.com/spreadsheets/d/{fid}/export?format=xlsx", ".xlsx"
    if kind == "document":
        return f"https://docs.google.com/document/d/{fid}/export?format=txt", ".txt"
    return f"https://drive.usercontent.google.com/download?id={fid}&export=download&confirm=t", ""


out = sys.argv[2] if len(sys.argv) > 2 else None
for kind, fid, name in entries(sys.argv[1]):
    print(fid, kind, name, sep="\t", flush=True)
    if out and kind != "folders" and not name.lower().endswith(ARCHIVES):
        url, ext = export_url(kind, fid)
        os.makedirs(out, exist_ok=True)
        data, disposition = get(url)
        if not ext:
            # Plain files: take the extension from the served filename (Drive names can lack one).
            served = re.search(r'filename="?([^";]+)', disposition)
            ext = os.path.splitext(served.group(1))[1] if served else ""
        name = re.sub(r'[\\/:*?"<>|]', "-", name)
        fname = name if not ext or name.lower().endswith(ext.lower()) else name + ext
        with open(os.path.join(out, fname), "wb") as f:
            f.write(data)
        print("   saved", len(data), "bytes ->", fname, flush=True)
