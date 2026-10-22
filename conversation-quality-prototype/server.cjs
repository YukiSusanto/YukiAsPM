const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

http.createServer((request, response) => {
  const pathname = request.url === '/' ? '/index.html' : request.url.split('?')[0];
  const filePath = path.join(process.cwd(), pathname);
  fs.readFile(filePath, (error, content) => {
    const extension = path.extname(filePath);
    response.writeHead(error ? 404 : 200, { 'Content-Type': contentTypes[extension] || 'text/plain; charset=utf-8' });
    response.end(error ? 'Not found' : content);
  });
}).listen(4321, '127.0.0.1', () => console.log('Local preview: http://127.0.0.1:4321/'));
