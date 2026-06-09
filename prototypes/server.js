const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = process.env.PORT || 4555
const ROOT = __dirname
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript' }

http
  .createServer((req, res) => {
    let url = decodeURIComponent(req.url.split('?')[0])
    if (url === '/') url = '/index.html'
    const file = path.join(ROOT, url)
    if (!file.startsWith(ROOT)) {
      res.writeHead(403); res.end('forbidden'); return
    }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); res.end('not found'); return }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' })
      res.end(data)
    })
  })
  .listen(PORT, () => console.log('prototypes server on http://localhost:' + PORT))
