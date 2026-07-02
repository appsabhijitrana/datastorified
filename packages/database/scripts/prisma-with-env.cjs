#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const cwd = process.cwd();
const repoRoot = path.resolve(__dirname, "../../..");
const candidates = [
  path.join(cwd, ".env.local"),
  path.join(cwd, ".env.development"),
  path.join(cwd, ".env"),
  path.join(repoRoot, ".env.local"),
  path.join(repoRoot, ".env.development"),
  path.join(repoRoot, ".env"),
];

for (const envPath of candidates) {
  if (!fs.existsSync(envPath)) continue;
  const contents = fs.readFileSync(envPath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index <= 0) continue;
    const key = trimmed.slice(0, index).trim();
    if (!key || process.env[key] !== undefined) continue;
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
  break;
}

const args = process.argv.slice(2);
const result = spawnSync("prisma", args, { stdio: "inherit", env: process.env });
process.exit(result.status ?? 1);
