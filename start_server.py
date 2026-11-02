from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import webbrowser, threading
ROOT=Path(__file__).parent
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs): super().__init__(*args,directory=str(ROOT),**kwargs)
server=ThreadingHTTPServer(("127.0.0.1",8000),Handler)
threading.Timer(0.5,lambda:webbrowser.open("http://127.0.0.1:8000")).start()
print("Luma kjører på http://127.0.0.1:8000 — trykk Ctrl+C for å stoppe.")
server.serve_forever()
