import express from "express";
import ViteExpress from "vite-express";
import { createServer } from "http";
import { router } from "./api/api.js";
import * as utils from "./lib/utils.js";

const __dirname = import.meta.dirname;

const app = express();

const server = createServer(app).listen(3000, () => {
  console.log("HTTP server is listening at http://localhost:3000!");
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(utils.getAbsoluteStaticPath()));
  console.log(__dirname);
} else {
  ViteExpress.bind(app, server).then(() => {
    console.log("Vite started!");
  });
}

app.use("/api", router);
