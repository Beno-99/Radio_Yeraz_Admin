/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require("http");
const { existsSync } = require("fs");
const next = require("next");
const { parse } = require("url");

const port = parseInt(process.env.PORT, 10) || 3000;
const hostname = process.env.HOSTNAME || "localhost";
const productionDir = "/home/lolugexye9o5/public_html/radioyeraz/player/frontend";
const dir = existsSync(productionDir) ? productionDir : __dirname;
const passenger =
  typeof globalThis.PhusionPassenger !== "undefined"
    ? globalThis.PhusionPassenger
    : null;

process.chdir(dir);

if (passenger) {
  passenger.configure({ autoInstall: false });
}

const app = next({ dev: false, dir });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  server.on("error", (err) => {
    throw err;
  });

  if (passenger) {
    server.listen("passenger", () => {
      console.log("Ready through Phusion Passenger");
    });
    return;
  }

  server.listen(port, hostname, () => {
    console.log(`Ready on http://${hostname}:${port}`);
  });
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
