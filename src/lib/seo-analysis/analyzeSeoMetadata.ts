import { SeoMeta } from "@prisma/client";

type SeoFields = Pick<
  SeoMeta,
  "seoTitle" | "metaDescription" | "focusKeyword" | "ogImage"
>;

export interface SeoAnalysis {
  score: number;
  grade: "good" | "needs-improvement" | "poor";
  missing: string[];
}

export const analyzeSeoMetadata = (
  slug: string | null,
  meta: SeoFields | null,
): SeoAnalysis => {
  const checks = [
    { name: "slug", complete: Boolean(slug) },
    { name: "SEO title", complete: Boolean(meta?.seoTitle) },
    { name: "meta description", complete: Boolean(meta?.metaDescription) },
    { name: "focus keyword", complete: Boolean(meta?.focusKeyword) },
    { name: "Open Graph image", complete: Boolean(meta?.ogImage) },
  ];
  const completeCount = checks.filter((check) => check.complete).length;
  const score = Math.round((completeCount / checks.length) * 100);

  return {
    score,
    grade: score >= 80 ? "good" : score >= 40 ? "needs-improvement" : "poor",
    missing: checks
      .filter((check) => !check.complete)
      .map((check) => check.name),
  };
};
