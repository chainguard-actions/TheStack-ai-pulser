#!/usr/bin/env python3
"""
Minimal npm registry proxy server.
Serves pulser-cli from a local tarball; proxies all other packages to the real npm registry.

Usage:
  python3 npm-registry-server.py <tarball_path> <pkg_version> <tarball_sha> <tarball_integrity>
"""
import gzip
import http.server
import json
import sys
import urllib.request

TARBALL_PATH = sys.argv[1]
PKG_VERSION = sys.argv[2]
TARBALL_SHA = sys.argv[3]
TARBALL_INTEGRITY = sys.argv[4]


class RegistryHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/pulser-cli'):
            if self.path.endswith('.tgz'):
                # Serve the tarball
                try:
                    with open(TARBALL_PATH, 'rb') as f:
                        body = f.read()
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/octet-stream')
                    self.send_header('Content-Length', str(len(body)))
                    self.end_headers()
                    self.wfile.write(body)
                except Exception as e:
                    self.send_response(500)
                    self.end_headers()
                    self.wfile.write(str(e).encode())
            else:
                # Serve package metadata
                meta = {
                    "name": "pulser-cli",
                    "dist-tags": {"latest": PKG_VERSION},
                    "versions": {
                        PKG_VERSION: {
                            "name": "pulser-cli",
                            "version": PKG_VERSION,
                            "dist": {
                                "tarball": "http://localhost:4873/pulser-cli/-/pulser-cli-{}.tgz".format(PKG_VERSION),
                                "shasum": TARBALL_SHA,
                                "integrity": TARBALL_INTEGRITY
                            },
                            "dependencies": {
                                "boxen": "^8.0.1",
                                "chalk": "^5.6.2",
                                "commander": "^14.0.3",
                                "gray-matter": "^4.0.3",
                                "js-yaml": "^4.1.0"
                            }
                        }
                    }
                }
                body = json.dumps(meta).encode()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                self.wfile.write(body)
        else:
            # Proxy to real npm registry
            try:
                url = "https://registry.npmjs.org{}".format(self.path)
                req = urllib.request.Request(
                    url,
                    headers={
                        'Accept': self.headers.get('Accept', '*/*'),
                        'Accept-Encoding': 'identity',
                        'User-Agent': 'npm/9.0.0 node/v20.0.0 linux x64'
                    }
                )
                with urllib.request.urlopen(req, timeout=60) as resp:
                    body = resp.read()
                    content_encoding = resp.headers.get('Content-Encoding', '')
                    ct = resp.headers.get('Content-Type', 'application/octet-stream')
                    status = resp.status

                # Decompress if needed (in case server ignores Accept-Encoding: identity)
                if content_encoding == 'gzip':
                    body = gzip.decompress(body)

                self.send_response(status)
                self.send_header('Content-Type', ct)
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(str(e).encode())

    def log_message(self, format, *args):
        pass  # Suppress access logs


if __name__ == '__main__':
    # Use ThreadingHTTPServer to handle concurrent npm requests
    server = http.server.ThreadingHTTPServer(('localhost', 4873), RegistryHandler)
    server.serve_forever()
