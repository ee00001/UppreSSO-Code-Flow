import http.server, socketserver, urllib.request, os, datetime

RELAY_PORT   = int(os.getenv("PORT", "9090"))
GATEWAY_URL  = os.getenv("GATEWAY_ORIGIN", "http://localhost:8080")

class Handler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/.well-known/ohttp-relay":
            self.send_error(404); return
        if self.headers.get("Content-Type") != "application/ohttp":
            self.send_error(400, "Bad Content-Type"); return

        length = int(self.headers["Content-Length"])
        body   = self.rfile.read(length)

        # 测试用输出，实际运行时删除
        client_ip = self.client_address[0]
        client_port = self.client_address[1]
        print(f"[{datetime.datetime.now()}] Client {client_ip}:{client_port} -> Relay")
        print(f"[{datetime.datetime.now()}] OHTTP packet (hex, head 64B): {body[:64].hex()}")
        print(f"[{datetime.datetime.now()}] Blind forward {len(body)}B -> {GATEWAY_URL}")

        # 盲转发到 Gateway
        try:
            req = urllib.request.Request(GATEWAY_URL + "/.well-known/ohttp-gateway",
                                         data=body,
                                         headers={"Content-Type": "application/ohttp"})
            resp = urllib.request.urlopen(req, timeout=10)
            out  = resp.read()
        except Exception as e:
            self.send_error(502, "Bad Gateway"); return

        # 原路返回
        self.send_response(200)
        self.send_header("Content-Type", "application/ohttp")
        self.send_header("Content-Length", str(len(out)))
        self.end_headers()
        self.wfile.write(out)

def run():
    with socketserver.TCPServer(("", RELAY_PORT), Handler) as httpd:
        print(f"Relay listening on :{RELAY_PORT} → Gateway {GATEWAY_URL}")
        httpd.serve_forever()

if __name__ == '__main__':
    run()