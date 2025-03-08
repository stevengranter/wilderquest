import express from "express";
import ViteExpress from "vite-express";
import { createServer } from "http";
import path from "path";

import { getFileList } from "./lib/utils.js";
import fs from "fs/promises";

let ABSOLUTE_STATIC_PATH = "";

console.log(import.meta.dirname);

if (process.env.NODE_ENV === "production") {
  ABSOLUTE_STATIC_PATH = path.join(import.meta.dirname, "../../dist/static");
} else {
  ABSOLUTE_STATIC_PATH = path.join(import.meta.dirname, "../../public");
}

const __dirname = import.meta.dirname;

const app = express();
const server = createServer(app).listen(3000, () => {
  console.log("HTTP server is listening at http://localhost:3000!");
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(ABSOLUTE_STATIC_PATH));
  console.log(__dirname);
} else {
  ViteExpress.bind(app, server).then(() => {
    console.log("Vite started!");
  });
}

app.get("/api/gifs", async (req, res) => {
  const dir = ABSOLUTE_STATIC_PATH + "/assets/gifs";
  const outDir = "assets/gifs";
  try {
    if (!dir) throw new Error("Directory not specified");
    const files = await getFileList(dir, outDir);
    return res.json(files);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error getting file list" });
  }
});
