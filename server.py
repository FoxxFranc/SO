"""Запасной сервер без зависимостей, если установлен Python, но нет Node.js."""
import http.server
import sys
import urllib.parse
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FILES = {'index.html', 'styles.css', 'app.js', 'course.js', 'lab.js', 'favicon.svg'}
TYPES = {'.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml'}

class Handler(http.server.BaseHTTPRequestHandler):
    def do_HEAD(self):
        self.serve(head=True)

    def do_GET(self):
        self.serve()

    def serve(self, head=False):
        name = urllib.parse.unquote(urllib.parse.urlsplit(self.path).path).lstrip('/') or 'index.html'
        if name not in FILES:
            self.send_error(404)
            return
        try:
            data = (ROOT / name).read_bytes()
        except OSError:
            self.send_error(500)
            return
        self.send_response(200)
        self.send_header('Content-Type', TYPES[Path(name).suffix] + '; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        if not head:
            self.wfile.write(data)

    def log_message(self, *args):
        pass

if __name__ == '__main__':
    server = None
    for port in range(4173, 4194):
        try:
            server = http.server.ThreadingHTTPServer(('127.0.0.1', port), Handler)
            break
        except OSError:
            continue
    if server is None:
        print('Could not open a free port in 4173-4193.')
        sys.exit(1)
    url = 'http://localhost:' + str(port)
    print('\nIT bez paniki\nLocal: ' + url + '\nClose this window or press Ctrl+C to stop.\n', flush=True)
    if '--open' in sys.argv:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
