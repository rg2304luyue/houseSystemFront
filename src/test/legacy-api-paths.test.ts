import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoot = join(process.cwd(), "src");
const forbiddenPaths = [
  "/sdApi/",
  "/houseinfo",
  "/housedetail",
  "/repaires",
  "/user/userinfo",
  "/email-auth",
  "/comments/messages",
  "'/contracts'",
  '"/contracts"',
  "'/alipay/pay'",
  '"/alipay/pay"',
];

const sourceFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "test" ? [] : sourceFiles(path);
    }
    return /\.(ts|vue)$/.test(entry.name) ? [path] : [];
  });

describe("legacy Flask API paths", () => {
  it("keeps migrated application code free of legacy endpoints", () => {
    const violations: string[] = [];

    for (const file of sourceFiles(sourceRoot)) {
      const relativePath = relative(sourceRoot, file).replaceAll("\\", "/");
      const content = readFileSync(file, "utf8");
      for (const endpoint of forbiddenPaths) {
        if (content.includes(endpoint)) {
          violations.push(`${relativePath}: ${endpoint}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
