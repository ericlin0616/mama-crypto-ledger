import { cpSync, mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const dest = join(root, "site");
const candidates = [
  join(root, ".vercel/output/static"),
  join(root, "dist/client"),
  join(root, "dist"),
  join(root, ".output/public"),
];

const src = candidates.find((dir) => existsSync(dir));
if (!src) {
  console.error("[pack-pages] no static output found");
  process.exit(1);
}

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });

const shell = join(dest, "_shell.html");
const indexPath = join(dest, "index.html");
const htmlPath = existsSync(indexPath)
  ? indexPath
  : existsSync(shell)
    ? shell
    : null;

if (!htmlPath) {
  console.error("[pack-pages] no index.html or _shell.html in", src);
  process.exit(1);
}

const html = readFileSync(htmlPath).toString("utf8").replaceAll("\u0000", "");
writeFileSync(indexPath, html);
writeFileSync(join(dest, "404.html"), html);
writeFileSync(join(dest, ".nojekyll"), "");
console.log("[pack-pages] wrote", dest, "from", src);
