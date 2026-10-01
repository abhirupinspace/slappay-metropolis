// Merges contracts/deployments/*.json into packages/core/deployments.json
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, "../../../contracts/deployments");
const dest = resolve(here, "../deployments.json");
const merged = {};
for (const f of readdirSync(src).filter((f) => f.endsWith(".json"))) {
  const d = JSON.parse(readFileSync(resolve(src, f), "utf8"));
  merged[String(d.chainId)] = d;
}
writeFileSync(dest, JSON.stringify(merged, null, 2) + "\n");
console.log("synced chains:", Object.keys(merged).join(", ") || "(none)");
