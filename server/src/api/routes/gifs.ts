import express, { Router } from "express";
const router: Router = express.Router();
import { getGifs } from "../middleware/gifs.middleware.js";
import { utils } from "../../lib/utils.js";

const absoluteGifsDir = utils.getAbsoluteStaticPath() + "/assets/gifs";

router.get("/", (req, res) => getGifs(req, res, absoluteGifsDir));

export { router };
