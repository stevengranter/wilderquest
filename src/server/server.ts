

// * Imports * //

// External imports
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express"; // Import Request, Repsonse types
import path from "path";

// Internal imports
import errorHandler from "./middleware/errorHandler.js";
import { dbService } from "./services/mysql.service.js";
import corsOptions from "./config/corsOptions.js";
import cors from "cors";
import ViteExpress from "vite-express";
import { apiRouter } from "./routes/api.route.js";
import { SCRIPT_DIR } from "./constants.js";

const PROTOCOL = process.env.PROTOCOL || "http"
const HOST = process.env.HOST || "localhost"
const PORT = Number(process.env.PORT) || 3000

// * Express App setup * //
const app = express();

// * Database setup * //
export const db = dbService;

// * Middleware * //
// Logger
// app.use(logger);
// CORS
app.use(cors(corsOptions));
// JSON
app.use(express.json());

app.use("/api", apiRouter);




// * Server setup * //

if (process.env.NODE_ENV !== "production") {
  // Error Handler
  app.use(errorHandler);
  ViteExpress.listen(app, PORT, () => {
    console.log(`Server running on ${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}`);
  });
} else {
  const publicDir = path.join(SCRIPT_DIR, "../../dist/public");

  // Serve static files from the 'public' directory
  app.use(express.static(publicDir));

  // Handle all other routes by serving 'index.html'
  app.get("*", (req: Request, res: Response) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });

   // Provide a default port

  // Error Handler
  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`Production server running on ${PROTOCOL}://${HOST}:${PORT}`); //Log the actual port
  });
}
