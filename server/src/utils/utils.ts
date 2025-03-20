import fs from "fs/promises";
import { ErrorRequestHandler } from "express";

function getAbsoluteStaticPath() {
  if (process.env.NODE_ENV === "production") {
    return "dist/static";
    // return path.join(import.meta.dirname, "../../../dist/static");
  } else {
    return "public";
    // return path.join(import.meta.dirname, "../../../public");
  }
}

async function getFileList(
  absoluteDir: string,
  outDir: string,
): Promise<{ url: string }[]> {
  const files = await fs.readdir(absoluteDir);
  return files.map((file: string) => ({
    url: `${outDir}/${file}`,
    id: crypto.randomUUID(),
  }));
}

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err);
  if (err instanceof Error) {
    res.status(400).send({ message: err.message });
  } else {
    res.status(500).send({ message: "Internal Server Error" });
  }
  next();
};

export { getAbsoluteStaticPath, getFileList, errorHandler };
