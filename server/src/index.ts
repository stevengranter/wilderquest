import express from "express";
import morgan from "morgan";
import ViteExpress from "vite-express";
import { createServer } from "http";
import { router } from "./api/api.js";
import * as utils from "./utils/utils.js";
import cors from "cors";
import chalk from "chalk";
import bodyParser from "body-parser";

const __dirname = import.meta.dirname;
const httpPort = process.env.HTTP_PORT || 3000;

const app = express();
// morgan logging middleware
app.use(morgan("dev"));

// CORS middlware config
app.use(
  cors({
    methods: ["GET", "POST", "DELETE", "PUT"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
    credentials: true, // Enable passing cookies across origins
  }),
);

const server = createServer(app).listen(httpPort, () => {
  console.log(
    chalk.green.bold("🕸️ HTTP server is listening at http://localhost:3000!"),
  );
  console.log(process.env.MY_SECRET);
});

app.use(bodyParser.json());
app.use("/api", router);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(utils.getAbsoluteStaticPath()));
  app.get("*", function (req, res) {
    res.sendFile("index.html", { root: utils.getAbsoluteStaticPath() });
  });
  console.log(__dirname);
} else {
  ViteExpress.bind(app, server).then(() => {
    console.log("Vite started!");
  });
}
