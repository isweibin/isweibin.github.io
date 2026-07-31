import matter from "gray-matter";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkCjkFriendly from "remark-cjk-friendly";
import remarkMath from "remark-math";
import remarkSupersub from "remark-supersub";
import { remarkAlert } from "remark-github-blockquote-alert";
import { toc } from "mdast-util-toc";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";

import { ID_RE, SITE, type Post } from "./site";
import type { Root as HastRoot } from "hast";
import type { Root as MdastRoot } from "mdast";

// Replace the first Typora-style [TOC] marker with an auto-generated <nav>.
// Later markers remain literal text.
function remarkTyporaToc() {
  return (tree: MdastRoot) => {
    const index = tree.children.findIndex(
      (node) =>
        node.type === "paragraph" &&
        node.children?.[0]?.type === "text" &&
        node.children[0].value === "[TOC]",
    );
    if (index === -1) return;

    const { map } = toc(tree, { tight: true, maxDepth: 4 });

    if (map) {
      tree.children.splice(index, 1, {
        type: "toc" as any,
        data: {
          hName: "nav",
          hProperties: { className: ["table-of-contents"] },
        },
        children: [map],
      } as any);
    } else {
      tree.children.splice(index, 1);
    }
  };
}

// Rewrite Typora-style local asset paths to absolute web routes:
//   ./<stem>.assets/img.png  ->  /<id>/img.png
function rehypeTyporaAssets() {
  return (tree: HastRoot, file: any) => {
    const { stem, id } = file.data;
    if (!stem || !id) return;

    const prefix = `./${stem}.assets/`;
    const target = `/${id}/`;

    visit(tree, "element", (node) => {
      const properties = node.properties;
      if (
        node.tagName === "img" &&
        typeof properties.src === "string" &&
        properties.src.startsWith(prefix)
      ) {
        properties.src = properties.src.replace(prefix, target);
      } else if (
        node.tagName === "a" &&
        typeof properties.href === "string" &&
        properties.href.startsWith(prefix)
      ) {
        properties.href = properties.href.replace(prefix, target);
      }
    });
  };
}

// Wrap <table> in a scrollable <div> so wide tables don't break narrow viewports.
function rehypeWrapTables() {
  return (tree: HastRoot) => {
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName !== "table" || !parent || index === undefined) return;

      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: { className: ["table-wrapper"] },
        children: [node],
      };
      return index + 1;
    });
  };
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm, { singleTilde: false })
  .use(remarkCjkFriendly)
  .use(remarkAlert)
  .use(remarkMath)
  .use(remarkSupersub)
  .use(remarkTyporaToc)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeTyporaAssets)
  .use(rehypeSlug)
  .use(rehypeKatex)
  .use(rehypeWrapTables)
  .use(rehypeStringify, { allowDangerousHtml: true });

export async function processMarkdown(
  raw: string,
  filename: string,
): Promise<Post> {
  const { data, content } = matter(raw);
  const stem = filename.replace(/\.md$/, "");

  if (typeof data.id !== "string" || !ID_RE.test(data.id)) {
    throw new Error(`${filename}: invalid id.`);
  }
  if (typeof data.title !== "string" || data.title.trim() === "") {
    throw new Error(`${filename}: invalid title.`);
  }
  if (data.summary !== undefined && typeof data.summary !== "string") {
    throw new Error(`${filename}: invalid summary.`);
  }
  if (
    data.lang !== undefined &&
    (typeof data.lang !== "string" || data.lang.trim() === "")
  ) {
    throw new Error(`${filename}: invalid lang.`);
  }

  const updatedDate =
    data.updated instanceof Date ? data.updated : new Date(data.updated);
  if (Number.isNaN(updatedDate.getTime())) {
    throw new Error(`${filename}: invalid updated date.`);
  }

  const pad2 = (value: number) => String(value).padStart(2, "0");
  const displayDate =
    `${updatedDate.getFullYear()}-${pad2(updatedDate.getMonth() + 1)}-${pad2(updatedDate.getDate())}` +
    ` ${pad2(updatedDate.getHours())}:${pad2(updatedDate.getMinutes())}`;

  const vfile = await processor.process({
    value: content,
    data: { stem, id: data.id },
  });

  const title = data.title.trim();
  const lang =
    typeof data.lang === "string" ? data.lang.trim() : SITE.defaultLang;

  return {
    title,
    summary: data.summary,
    id: data.id,
    updated: displayDate,
    updatedAt: updatedDate.toISOString(),
    lang,
    html: String(vfile),
  };
}
