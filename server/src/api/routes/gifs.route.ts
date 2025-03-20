import express, { Router } from "express";
const router: Router = express.Router();
import { getGifs } from "../middleware/gifs.middleware.js";
import { getAbsoluteStaticPath } from "../../utils/utils.js";

const absoluteGifsDir = getAbsoluteStaticPath() + "/assets/gifs";

router.get("/", (req, res) => getGifs(req, res, absoluteGifsDir));

export { router };
