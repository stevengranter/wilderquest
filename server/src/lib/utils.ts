import fs from "fs/promises";

export async function getFileList(
  dir: string,
  outDir: string,
): Promise<string[]> {
  const files = await fs.readdir(dir);
  return files.map((file: string) => ({
    path: `${outDir}/${file}`,
  }));
}
