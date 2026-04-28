const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const DATA_DIR = path.join(__dirname, 'data');
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(ARTICLES_FILE)) {
  fs.writeFileSync(ARTICLES_FILE, JSON.stringify([], null, 2));
}

function readArticles() {
  try {
    const data = fs.readFileSync(ARTICLES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取文章失败:', error);
    return [];
  }
}

function writeArticles(articles) {
  try {
    fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articles, null, 2));
    return true;
  } catch (error) {
    console.error('写入文章失败:', error);
    return false;
  }
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (pathname === '/api/articles') {
    if (req.method === 'GET') {
      const articles = readArticles();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(articles));
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const newArticle = JSON.parse(body);
          const articles = readArticles();
          articles.unshift(newArticle);
          if (writeArticles(articles)) {
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, article: newArticle }));
          } else {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: '保存失败' }));
          }
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: '数据格式错误' }));
        }
      });
    } else {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '不支持的请求方法' }));
    }
  } else if (pathname.startsWith('/api/articles/')) {
    const id = pathname.split('/')[3];

    if (req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const updatedData = JSON.parse(body);
          const articles = readArticles();
          const index = articles.findIndex(a => a.id === id);
          if (index !== -1) {
            const updatedArticle = { ...articles[index], ...updatedData, updatedAt: Date.now() };
            articles.splice(index, 1);
            articles.unshift(updatedArticle);
            if (writeArticles(articles)) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            } else {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: '更新失败' }));
            }
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: '文章不存在' }));
          }
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: '数据格式错误' }));
        }
      });
    } else if (req.method === 'DELETE') {
      const articles = readArticles();
      const filtered = articles.filter(a => a.id !== id);
      if (filtered.length !== articles.length) {
        if (writeArticles(filtered)) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: '删除失败' }));
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: '文章不存在' }));
      }
    } else {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '不支持的请求方法' }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '路由不存在' }));
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`数据服务器运行在 http://localhost:${PORT}`);
  console.log(`数据文件保存在: ${ARTICLES_FILE}`);
});
