# Agent Custom Rules

## Development Server Configuration
Whenever initializing or developing web application projects in this workspace (or upcoming workspaces), configure the development server script or runner configuration (e.g. Python's `dev_server.py`, Node's `package.json` scripts, or Vite configuration) to automatically open the default web browser when the server starts.

- For **Python Servers**:
  Import the standard `webbrowser` and `threading` modules, and start a background thread on launch that sleeps briefly (e.g., 1.0 second) and then executes `webbrowser.open("http://localhost:<PORT>")`.
  ```python
  import threading
  import webbrowser
  import time

  def open_browser():
      time.sleep(1.0)
      webbrowser.open("http://localhost:8000")

  threading.Thread(target=open_browser, daemon=True).start()
  ```

- For **Node.js/NPM/Vite Servers**:
  Enable the `--open` flag in the dev script (e.g., `"dev": "vite --open"` or `"start": "next dev --open"`) or use packages like `open` in Node.js startup scripts.
