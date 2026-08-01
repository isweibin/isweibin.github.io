export interface Post {
  id: string;
  title: string;
  summary?: string;
  updated: string;   // Local display time, e.g. "2026-05-05 08:30".
  updatedAt: string; // ISO 8601 for machine-readable metadata.
  lang: string;      // BCP 47 language tag, e.g. "zh-CN".
  html: string;
}
