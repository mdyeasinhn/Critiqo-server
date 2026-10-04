export interface ImageForAnalysis {
  id: string;
  url: string;
  alt: string | null;
  fileName: string | null;
}

export type ImageIssueType =
  | "missing-alt"
  | "alt-too-short"
  | "alt-too-long"
  | "keyword-stuffing"
  | "non-descriptive-file-name";

export interface ImageAnalysisIssue {
  type: ImageIssueType;
  reason: string;
}

export interface AnalyzedImage extends ImageForAnalysis {
  issues: ImageAnalysisIssue[];
}

const MIN_ALT_LENGTH = 10;
const MAX_ALT_LENGTH = 125;
const NON_DESCRIPTIVE_FILENAME =
  /^(?:img|dsc|image|photo|picture|screenshot|untitled)[-_ ]*\d*$/i;

const countKeywordOccurrences = (alt: string, keyword: string): number => {
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = alt.match(new RegExp(`\\b${escapedKeyword}\\b`, "gi"));
  return matches?.length ?? 0;
};

const filenameWithoutExtension = (filename: string): string =>
  filename
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();

export const analyzeImages = (
  images: readonly ImageForAnalysis[],
  focusKeyword: string | null | undefined,
): AnalyzedImage[] => {
  const keyword = focusKeyword?.trim() ?? "";

  return images.map((image) => {
    const issues: ImageAnalysisIssue[] = [];
    const alt = image.alt?.trim() ?? "";

    if (!alt) {
      issues.push({
        type: "missing-alt",
        reason: "Add alternative text describing the image.",
      });
    } else {
      if (alt.length < MIN_ALT_LENGTH) {
        issues.push({
          type: "alt-too-short",
          reason: `Alternative text must be at least ${MIN_ALT_LENGTH} characters.`,
        });
      }
      if (alt.length > MAX_ALT_LENGTH) {
        issues.push({
          type: "alt-too-long",
          reason: `Alternative text must be no more than ${MAX_ALT_LENGTH} characters.`,
        });
      }
      if (keyword && countKeywordOccurrences(alt, keyword) > 1) {
        issues.push({
          type: "keyword-stuffing",
          reason:
            "The focus keyword appears more than once in the alternative text.",
        });
      }
    }

    const fileName = image.fileName?.trim() ?? "";
    if (
      !fileName ||
      NON_DESCRIPTIVE_FILENAME.test(filenameWithoutExtension(fileName))
    ) {
      issues.push({
        type: "non-descriptive-file-name",
        reason:
          "Use a descriptive file name instead of a generic camera or image name.",
      });
    }

    return { ...image, issues };
  });
};
