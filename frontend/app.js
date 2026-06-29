const { createServer } = require("http");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = Number(process.env.PORT) || 3000;

const app = next({
  dev,
  hostname,
  port,
});
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = createServer((req, res) => {
      const requestUrl = new URL(
        req.url || "/",
        `http://${req.headers.host || hostname}`,
      );

      if (requestUrl.pathname === "/") {
        res.statusCode = 307;
        res.setHeader("Location", `/dashboard${requestUrl.search}`);
        res.end();
        return;
      }

      handle(req, res).catch((error) => {
        console.error("Request handling failed:", error);
        res.statusCode = 500;
        res.end("Internal Server Error");
      });
    });

    server.on("error", (error) => {
      throw error;
    });

    server.listen(port, hostname, () => {
      console.log(`Ready on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start Next.js:", error);
    process.exit(1);
  });
