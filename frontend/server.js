/* eslint-disable @typescript-eslint/no-require-imports */
process.chdir('/home/lolugexye9o5/public_html/radioyeraz/player/frontend');

const { createServer } = require("http");
const next = require("next");
const { parse } = require("url");

const port = parseInt(process.env.PORT, 10) || 3000;
const dir = '/home/lolugexye9o5/public_html/radioyeraz/player/frontend';

const app = next({ dev: false, dir });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
