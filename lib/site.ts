import { join } from "node:path";

export interface Post {
  id: string;
  title: string;
  summary?: string;
  updated: string;   // Local display time, e.g. "2026-05-05 08:30".
  updatedAt: string; // ISO 8601 for machine-readable metadata.
  lang: string;      // BCP 47 language tag, e.g. "zh-CN".
  html: string;
}

export const SITE = {
  title: "isweibin's blog",
  email: "hi@isweibin.com",
  url: "https://isweibin.com",
  defaultLang: "zh-CN",
} as const;

const ROOT = process.cwd();

export const PATHS = {
  root: ROOT,
  posts: join(ROOT, "posts"),
  public: join(ROOT, "public"),
  dist: join(ROOT, "dist"),
};

// Frontmatter IDs use lowercase letters and digits, separated by single hyphens.
export const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
