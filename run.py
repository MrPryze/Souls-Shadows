# run.py — serve project ROOT so /public and /src are both visible
import http.server, socketserver, pathlib, os

PORT = 8000
ROOT = pathlib.Path(__file__).resolve().parent  # overlord/
os.chdir(ROOT)  # make both /public and /src accessible

class Handler(http.server.SimpleHTTPRequestHandler):
    # Optional: show cleaner logs
    def log_message(self, fmt, *args): 
        print(self.address_string(), "-", self.log_date_time_string(), fmt % args)

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at http://localhost:{PORT}/public/index.html")
    httpd.serve_forever()
