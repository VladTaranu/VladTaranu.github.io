import http.server
import socketserver
import os

PORT = 8000
DIRECTORY = "."

class SPARequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/content/'):
            # Serve content files normally
            return super().do_GET()
        else:
            # Serve index.html for all other routes
            if self.path == "/" or self.path.endswith(".html") or not os.path.exists(self.translate_path(self.path)):
                self.path = "index.html"
            return super().do_GET()

handler = SPARequestHandler
handler.extensions_map.update({
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
})

with socketserver.TCPServer(("", PORT), handler) as httpd:
    print(f"Serving at port {PORT}")
    httpd.serve_forever()