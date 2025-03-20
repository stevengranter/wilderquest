import { app } from "./index.js";
import session from "express-session";
import sessionStore from "./sessionStore.js";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import bodyParser from "body-parser";
dotenv.config();

export default function addMiddleware() {
  app.use(
    // Morgan logging
    morgan("dev"),
    // JSON body parser
    bodyParser.json(),
    // Session middleware config
    session({
      name: "session_cookie_name",
      secret: process.env.SESSION_SECRET || "secret",
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
    }),
    // CORS middleware config
    cors({
      methods: ["GET", "POST", "DELETE", "PUT"], // Allowed HTTP methods
      allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
      credentials: true, // Enable passing cookies across origins
    }),
  );
  // Add session console log middleware
  app.use((req, res, next) => {
    console.log("Session:", req.session);
    next();
  });

  return app;
}
