# run.py — robust local dev server for Souls & Shadows
import http.server
import socketserver
import os
import sys
import webbrowser
from pathlib import Path

PORT = 8000

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    # Serve from repo root; default file = /public/index.html
    def do_GET(self):
        # default to serving /public/ if requesting /
        if self.path in ('', '/', '/index.html'):
            self.path = '/public/index.html'
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

    # nicer logging
    def log_message(self, fmt, *args):
        sys.stdout.write("%s - - %s\n" % (self.client_address[0], fmt % args))

def main():
    # cd to repo root (this file's parent)
    repo_root = Path(__file__).resolve().parent
    os.chdir(repo_root)

    # create server
    with socketserver.TCPServer(("", PORT), QuietHandler) as httpd:
        url = f"http://localhost:{PORT}/public/"
        print(f"\nServing Souls & Shadows at {url}")
        print("Press Ctrl+C to stop.\n")

        # try to open the browser once
        try:
            webbrowser.open(url)
        except Exception as e:
            print(f"(Could not open browser automatically: {e})")

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down…")
        finally:
            httpd.server_close()

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("Fatal error in run.py:", e)
        print("Tip: run `python -m http.server 8000` from the repo root and open /public/")
        input("Press Enter to close…")
