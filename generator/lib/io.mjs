import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export async function ensureDirectory(directory) {
  await mkdir(directory, { recursive: true });
}

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export async function writeJson(filePath, value) {
  await ensureDirectory(path.dirname(filePath));
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function writeText(filePath, value) {
  await ensureDirectory(path.dirname(filePath));
  await writeFile(filePath, value, "utf8");
}

export function gamesToCsv(games) {
  const header = "game,n1,n2,n3,n4,n5,n6";
  const rows = games.map((game, index) => [index + 1, ...game].join(","));
  return `${[header, ...rows].join("\n")}\n`;
}

export function parseGamesCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  return lines.slice(1).filter(Boolean).map((line, rowIndex) => {
    const fields = line.split(",").map((field) => field.trim());
    const numbers = fields.slice(-6).map(Number);
    if (numbers.some((number) => !Number.isInteger(number))) {
      throw new Error(`Linha ${rowIndex + 2} contém dezenas inválidas.`);
    }
    return numbers;
  });
}

export async function readGamesCsv(filePath) {
  return parseGamesCsv(await readFile(filePath, "utf8"));
}

export async function sha256File(filePath) {
  const content = await readFile(filePath);
  return createHash("sha256").update(content).digest("hex");
}

async function listFilesRecursive(rootDirectory, currentDirectory = rootDirectory) {
  const entries = await readdir(currentDirectory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(currentDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFilesRecursive(rootDirectory, fullPath));
    } else if (entry.isFile()) {
      files.push(path.relative(rootDirectory, fullPath).split(path.sep).join("/"));
    }
  }
  return files.sort();
}

export async function sha256Directory(rootDirectory, include) {
  const hash = createHash("sha256");
  const files = (await listFilesRecursive(rootDirectory)).filter(include);
  for (const relativePath of files) {
    const fullPath = path.join(rootDirectory, relativePath);
    const info = await stat(fullPath);
    hash.update(`${relativePath}\n${info.size}\n`);
    hash.update(await readFile(fullPath));
    hash.update("\n");
  }
  return { hash: hash.digest("hex"), files };
}
