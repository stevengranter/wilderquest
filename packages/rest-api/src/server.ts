// src/rest-server.ts

// * Imports * //

// External imports
import "dotenv/config";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
// Internal imports
import { rootRouter } from "./routes/root.route.js";
import { usersRouter } from "./routes/users.route.js";
import logger from "./middleware/logger.js";
import { SCRIPT_DIR, VIEWS_DIR } from "./constants.js";
import { PORT, HOST, PROTOCOL } from "./constants.js";
import errorHandler from "./middleware/errorHandler.js";
import { dbService } from "./services/mysql.service.js";
import { authRouter } from "./routes/auth.route.js";
import { refreshTokenRouter } from "./routes/refresh.route.js";
import { logoutRouter } from "./routes/logout.route.js";
import corsOptions from "./config/corsOptions.js";
import cors from "cors";

// * Express App setup * //
const app = express();

// * Database setup * //
export const db = dbService;

// * Middleware * //
// Logger
app.use(logger);
// CORS
app.use(cors(corsOptions));
// JSON
app.use(express.json());
// Cookie Parser
app.use(cookieParser());

// Public static files
app.use("/", express.static(path.join(SCRIPT_DIR, "../public")));

// Route config
const routes = [
  { url: "/", router: rootRouter },
  { url: "/users", router: usersRouter },
  { url: "/auth", router: authRouter },
  { url: "/refresh", router: refreshTokenRouter },
  { url: "/logout", router: logoutRouter },
];

routes.forEach((route) => {
  app.use(route.url, route.router);
});

// 404 route
app.use("*", (req, res) => {
  res.status(404);
  if (req.accepts("html")) {
    res.sendFile(path.join(VIEWS_DIR, "404.html"));
  } else if (req.accepts("json")) {
    res.json({ message: "404 Not Found" });
  } else {
    res.type("txt").send("404 Not Found");
  }
});

// Error Handler
app.use(errorHandler);

// * Server setup * //
app.listen(PORT, () =>
  console.log(`Server running on ${PROTOCOL}://${HOST}:${PORT}`),
);
