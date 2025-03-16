import { Request, Response } from "express";
import { getFileList } from "../../utils/utils.js";

const publicGifsDir = "assets/gifs";

const getGifs = async (req: Request, res: Response, gifsDir: string) => {
  try {
    const files = await getFileList(gifsDir, publicGifsDir);
    return res.json(files);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error getting file list" });
  }
};

export { getGifs };
