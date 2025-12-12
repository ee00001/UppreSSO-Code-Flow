import http.server, socketserver, urllib.request, os, datetime

RELAY_PORT   = int(os.getenv("PORT", "9090"))
GATEWAY_URL  = os.getenv("GATEWAY_ORIGIN", "http://localhost:8080/openid-connect-server-webapp")

class Handler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        if self.headers.get("Content-Type") != "message/ohttp-req":
            self.send_error(400, "Bad Content-Type"); return

        length = int(self.headers.get("Content-Length", 0))
        body   = self.rfile.read(length)

        # # 调试输出：客户端请求信息
        # client_ip, client_port = self.client_address
        # print("="*60)
        # print(f"[{datetime.datetime.now()}] Client {client_ip}:{client_port} → Relay")
        # print(f"Headers: {dict(self.headers)}")
        # print(f"OHTTP packet len={len(body)} head64={body[:64].hex()}")
        # print(f"Forwarding to Gateway: {GATEWAY_URL}/gateway")

        # 构造发送给 Gateway 的请求
        req = urllib.request.Request(
            GATEWAY_URL + "/gateway",
            data=body,
            headers={
                "Content-Type": "message/ohttp-req",
                "Content-Length": str(len(body)),
            },
            method="POST"
        )

        # 盲转发到 Gateway
        try:
            with urllib.request.urlopen(req) as resp:
                gateway_resp = resp.read()
                status_code = resp.getcode()
                print(f"Gateway status={status_code}, resp_len={len(gateway_resp)}")
                if len(gateway_resp) > 0:
                    print(f"Gateway resp head64={gateway_resp[:64].hex()}")
        except Exception as e:
            print(f"[ERROR] Relay to Gateway failed: {e}")
            self.send_response(502)
            self.end_headers()
            self.wfile.write(f"Relay error: {e}".encode("utf-8"))
            return

        # 转发 Gateway 的响应给客户端
        self.send_response(status_code)
        self.send_header("Content-Type", "message/ohttp-resp")
        self.send_header("Content-Length", str(len(gateway_resp)))
        self.end_headers()
        self.wfile.write(gateway_resp)

def run():
    with socketserver.TCPServer(("", RELAY_PORT), Handler) as httpd:
        print(f"Relay listening on :{RELAY_PORT} → Gateway {GATEWAY_URL}")
        httpd.serve_forever()

if __name__ == '__main__':
    run()