/**
 * Custom Next.js server with react-dev-inspector launch-editor middleware.
 * https://react-dev-inspector.zthxxx.me/docs/integration/nextjs
 */
import { createServer } from "node:http";
import next from "next";
import { launchEditorMiddleware } from "@react-dev-inspector/middleware";

// Force Cursor as the editor opened by react-dev-inspector (defaults to `code` / VS Code).
process.env.REACT_EDITOR = process.env.REACT_EDITOR || "cursor";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST || "localhost";
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = next({
  dev,
  hostname,
  port,
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const middlewares = [
      launchEditorMiddleware,
      (request, response) => handle(request, response),
    ];

    const middlewarePipeline = middlewares.reduceRight(
      (nextFn, middleware) => () => {
        middleware(req, res, nextFn);
      },
      () => {},
    );

    try {
      middlewarePipeline();
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  })
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.debug(`\n > Ready on http://${hostname}:${port} \n`);
      console.debug(` > Inspector editor: ${process.env.REACT_EDITOR}\n`);
    });
});
