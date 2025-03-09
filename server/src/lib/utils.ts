import fs from "fs/promises";

export async function getFileList(
  dir: string,
  outDir: string,
): Promise<{ url: string }[]> {
  const files = await fs.readdir(dir);
  return files.map((file: string) => ({
    url: `${outDir}/${file}`,
    id: crypto.randomUUID(),
  }));
}
