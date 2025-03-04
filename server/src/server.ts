import express from "express";
import ViteExpress from "vite-express";
import { createServer } from "http";
import path from "path";

const __dirname = import.meta.dirname;

const app = express();
const server = createServer(app).listen(3000, () => {
    console.log("HTTP server is listening at http://localhost:3000!");
});

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../../dist/static")));
    console.log(__dirname)
} else {
    ViteExpress.bind(app, server).then(() => {
        console.log("Vite started!");
    });
}
