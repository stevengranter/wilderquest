import express, { Express } from "express";
import ViteExpress from "vite-express";
import { createServer } from "http";
import chalk from "chalk";
import dotenv from "dotenv";

import { router } from "./router.js";
import { getAbsoluteStaticPath } from "./utils/utils.js";
import addMiddleware from "./addMiddleware.js";
dotenv.config();

const __dirname = import.meta.dirname;
const httpPort = process.env.HTTP_PORT || 3000;

export const app: Express = express();

addMiddleware();

const server = createServer(app).listen(httpPort, () => {
  console.log(
    chalk.green.bold("🕸️ HTTP server is listening at http://localhost:3000!"),
  );
  console.log(process.env.MY_SECRET);
});

app.use("/", router);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(getAbsoluteStaticPath()));
  app.get("*", function (req, res) {
    res.sendFile("index.html", { root: getAbsoluteStaticPath() });
  });
  console.log(__dirname);
} else {
  ViteExpress.bind(app, server).then(() => {
    console.log("Vite started!");
  });
}
