import os
import sys
import time
import socket
import threading
import webbrowser
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler


PORT = 8000

def get_last_modified_time():
    max_mtime = 0
    for root, dirs, files in os.walk('.'):
        # Exclude hidden directories and virtual envs if any
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        for f in files:
            if f.startswith('.'):
                continue
            path = os.path.join(root, f)
            try:
                mtime = os.path.getmtime(path)
                if mtime > max_mtime:
                    max_mtime = mtime
            except OSError:
                pass
    return max_mtime

class LiveReloadHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        # Format logs cleanly to standard output
        sys.stdout.write("%s - - [%s] %s\n" %
                         (self.address_string(),
                          self.log_date_time_string(),
                          format%args))
        sys.stdout.flush()

    def do_GET(self):
        # Normalize path to ignore queries/hashes
        normalized_path = self.path.split('?', 1)[0].split('#', 1)[0]
        if normalized_path in ('', '/', '/index.html'):
            try:
                # Read index.html
                with open('index.html', 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Injection script for reloading
                inject_script = """
                <!-- Live Reload Script -->
                <script>
                (function() {
                    let eventSource;
                    function connect() {
                        eventSource = new EventSource('/live-reload');
                        eventSource.onmessage = function(event) {
                            if (event.data === 'reload') {
                                console.log('File change detected, reloading...');
                                window.location.reload();
                            }
                        };
                        eventSource.onerror = function() {
                            console.log('Live reload connection lost, reconnecting in 2s...');
                            eventSource.close();
                            setTimeout(connect, 2000);
                        };
                    }
                    connect();
                })();
                </script>
                """
                # Find </body> or </html> to inject before
                idx = content.lower().rfind('</body>')
                if idx != -1:
                    content = content[:idx] + inject_script + content[idx:]
                else:
                    idx_html = content.lower().rfind('</html>')
                    if idx_html != -1:
                        content = content[:idx_html] + inject_script + content[idx_html:]
                    else:
                        content += inject_script
                
                encoded = content.encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', str(len(encoded)))
                self.end_headers()
                self.wfile.write(encoded)
            except Exception as e:
                self.send_error(500, str(e))
        elif normalized_path == '/live-reload':
            self.send_response(200)
            self.send_header('Content-Type', 'text/event-stream')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Connection', 'keep-alive')
            self.end_headers()
            
            last_check = get_last_modified_time()
            try:
                while True:
                    time.sleep(0.5)
                    current = get_last_modified_time()
                    if current > last_check:
                        last_check = current
                        self.wfile.write(b"data: reload\n\n")
                        self.wfile.flush()
                    else:
                        # Periodically send a keep-alive comment
                        self.wfile.write(b": keepalive\n\n")
                        self.wfile.flush()
            except (ConnectionError, BrokenPipeError, socket.error):
                # Clean exit when client disconnects
                pass
        else:
            super().do_GET()

    def end_headers(self):
        # Prevent caching for files to ensure styles/scripts reload immediately
        if not self.path.startswith('/live-reload'):
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        super().end_headers()

def open_browser():
    time.sleep(1.0)
    print(f"Automatically opening browser at http://localhost:{PORT}")
    sys.stdout.flush()
    try:
        webbrowser.open(f"http://localhost:{PORT}")
    except Exception as e:
        print(f"Failed to open browser automatically: {e}")
        sys.stdout.flush()

def run_server():
    server_address = ('', PORT)
    httpd = ThreadingHTTPServer(server_address, LiveReloadHandler)
    print(f"Development server running on http://localhost:{PORT}")
    sys.stdout.flush()
    
    # Auto-open browser in a separate thread
    threading.Thread(target=open_browser, daemon=True).start()
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        sys.stdout.flush()

if __name__ == '__main__':
    run_server()
