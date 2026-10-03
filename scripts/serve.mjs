import http from 'node:http';
import path from 'node:path';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = path.resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const port = Number(process.env.PORT || 4177);
const types = { '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2' };
const server = http.createServer(async (request,response) => {
  const requestId = crypto.randomUUID();
  try {
    const pathname = decodeURIComponent(new URL(request.url,'http://localhost').pathname);
    const localPath = path.resolve(root, '.'+pathname);
    if (localPath !== root && !localPath.startsWith(root + path.sep)) { response.writeHead(403); response.end(); return; }
    const info = await stat(localPath);
    const file = info.isDirectory() ? path.join(localPath,'index.html') : localPath;
    const content = await readFile(file);
    response.writeHead(200,{'Content-Type':types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Request-Id':requestId});
    response.end(content);
  } catch (error) {
    const status = error.code === 'ENOENT' ? 404 : 500;
    console.warn(JSON.stringify({event:'preview_request_failed',requestId,status}));
    response.writeHead(status,{'Content-Type':'text/plain; charset=utf-8'});response.end(status===404?'Страница не найдена':'Не удалось загрузить страницу');
  }
});
server.listen(port,'127.0.0.1',() => console.log(`Local: http://127.0.0.1:${port}`));
