import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import http from 'http';
import https from 'https';
import { URL } from 'url';

function proxyPlugin(): Plugin {
  return {
    name: 'proxy-plugin',
    configureServer(server) {
      server.middlewares.use('/api/proxy', (req, res) => {
        const urlObj = new URL(req.url || '', `http://${req.headers.host}`);
        const targetUrl = urlObj.searchParams.get('url');
        
        if (!targetUrl) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Missing url parameter');
          return;
        }

        try {
          const target = new URL(targetUrl);
          const isHttps = target.protocol === 'https:';
          const client = isHttps ? https : http;
          
          const options = {
            hostname: target.hostname,
            port: target.port || (isHttps ? 443 : 80),
            path: target.pathname + target.search,
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            }
          };

          const proxyReq = client.request(options, (proxyRes) => {
            let data = '';
            
            proxyRes.on('data', (chunk) => {
              data += chunk;
            });
            
            proxyRes.on('end', () => {
              res.writeHead(200, {
                'Content-Type': 'text/html; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
              });
              res.end(data);
            });
          });

          proxyReq.on('error', (err) => {
            console.error('Proxy error:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Proxy error: ' + err.message);
          });

          proxyReq.end();
        } catch (err) {
          console.error('URL parse error:', err);
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Invalid URL');
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), proxyPlugin()],
  server: {
    port: 5173,
    strictPort: true
  }
});
