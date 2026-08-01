process.env.TZ ||= "Asia/Shanghai";

import { basename, join } from "node:path";
import { access, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { Glob } from "bun";

import type { Post } from "./lib/types";
import { processMarkdown } from "./lib/markdown";
import { renderHome, renderPost, renderSitemap } from "./lib/templates";

const ROOT = process.cwd();

const PATH = {
  root: ROOT,
  posts: join(ROOT, "posts"),
  public: join(ROOT, "public"),
  dist: join(ROOT, "dist"),
};

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

type BuiltPost = { post: Post; filename: string };

async function build(): Promise<void> {
  const startedAt = performance.now();
  const built: BuiltPost[] = [];

  for await (const relativePath of new Glob("posts/*.md").scan(PATH.root)) {
    const filename = basename(relativePath);
    const raw = await readFile(join(PATH.root, relativePath), "utf8");
    built.push({ post: await processMarkdown(raw, filename), filename });
  }

  const seenIds = new Map<string, string>();
  for (const { post, filename } of built) {
    const previous = seenIds.get(post.id);
    if (previous !== undefined) {
      throw new Error(
        `Duplicate ID "${post.id}" in "${filename}" (also seen in "${previous}").`,
      );
    }
    seenIds.set(post.id, filename);
  }

  const posts = built.map(({ post }) => post);
  posts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  await rm(PATH.dist, { recursive: true, force: true });
  await mkdir(PATH.dist, { recursive: true });

  if (await fileExists(PATH.public)) {
    await cp(PATH.public, PATH.dist, { recursive: true });
  }

  await Promise.all(
    built.map(async ({ post, filename }) => {
      const outputDir = join(PATH.dist, post.id);
      await mkdir(outputDir, { recursive: true });

      const assetsDir = join(
        PATH.posts,
        `${filename.replace(/\.md$/, "")}.assets`,
      );
      if (await fileExists(assetsDir)) {
        await cp(assetsDir, outputDir, { recursive: true });
      }

      await writeFile(join(outputDir, "index.html"), renderPost(post));
    }),
  );

  await Promise.all([
    writeFile(join(PATH.dist, "index.html"), renderHome(posts)),
    writeFile(join(PATH.dist, "sitemap.xml"), renderSitemap(posts)),
  ]);

  const duration = (performance.now() - startedAt).toFixed(0);
  console.log(`Successfully built ${posts.length} posts in ${duration}ms.`);
}

if (import.meta.main) {
  try {
    await build();
  } catch (error) {
    console.error(
      "Build failed:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}
