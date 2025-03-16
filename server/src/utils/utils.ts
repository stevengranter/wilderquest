import fs from "fs/promises";

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

const utils = { getAbsoluteStaticPath, getFileList };

export { getAbsoluteStaticPath, getFileList, utils };
