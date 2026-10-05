import sanitizeHtml from "sanitize-html";

export type SeoCheckStatus = "pass" | "warn" | "fail";

export interface SeoCheck<T = unknown> {
  id: string;
  status: SeoCheckStatus;
  message: string;
  value: T;
}

export interface KeywordPlacementInput {
  title: string;
  description: string;
  slug: string;
  html: string;
  keyword: string;
}

export interface SeoAnalysisInput extends KeywordPlacementInput {}

const toText = (html: string): string => {
  let text = "";
  sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {},
    textFilter: (chunk) => {
      text += `${chunk} `;
      return chunk;
    },
  });
  return text.replace(/\s+/g, " ").trim();
};

const wordTokens = (text: string): string[] =>
  text.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) ?? [];

const containsPhrase = (text: string, phrase: string): boolean => {
  const normalizedText = text
    .toLowerCase()
    .replace(/[\s-]+/g, " ")
    .trim();
  const normalizedPhrase = phrase
    .toLowerCase()
    .replace(/[\s-]+/g, " ")
    .trim();
  if (!normalizedPhrase) return false;

  const escapedPhrase = normalizedPhrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `(^|[^\\p{L}\\p{N}])${escapedPhrase}($|[^\\p{L}\\p{N}])`,
    "u",
  ).test(normalizedText);
};

const extractedTextForTag = (html: string, tag: string): string[] => {
  const values: string[] = [];
  const sanitized = sanitizeHtml(html, {
    allowedTags: [tag],
    allowedAttributes: {},
  });
  const pattern = new RegExp(
    `<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}\\s*>`,
    "gi",
  );
  for (const match of sanitized.matchAll(pattern)) {
    values.push(toText(match[1] ?? ""));
  }
  return values;
};

const extractVisibleText = (html: string): string => toText(html);

export const calculateKeywordDensity = (
  text: string,
  keyword: string,
): SeoCheck<number> => {
  const words = wordTokens(text);
  const normalizedKeyword = wordTokens(keyword);
  if (normalizedKeyword.length === 0) {
    return {
      id: "keyword-density",
      status: "warn",
      message: "Add a focus keyword to calculate keyword density.",
      value: 0,
    };
  }
  if (words.length === 0) {
    return {
      id: "keyword-density",
      status: "warn",
      message: "Add content before evaluating keyword density.",
      value: 0,
    };
  }

  const normalizedText = words.map((word) => word.toLowerCase());
  const target = normalizedKeyword.map((word) => word.toLowerCase());
  let occurrences = 0;
  for (
    let index = 0;
    index <= normalizedText.length - target.length;
    index += 1
  ) {
    if (
      target.every((word, offset) => normalizedText[index + offset] === word)
    ) {
      occurrences += 1;
    }
  }

  const density = Number(((occurrences / words.length) * 100).toFixed(2));
  const status: SeoCheckStatus =
    density >= 0.5 && density <= 2.5 ? "pass" : "warn";
  const message =
    status === "pass"
      ? `Keyword density is ${density}%, within the recommended 0.5% to 2.5% range.`
      : `Keyword density is ${density}%; aim for 0.5% to 2.5%.`;

  return { id: "keyword-density", status, message, value: density };
};

export const countWords = (text: string): SeoCheck<number> => {
  const count = wordTokens(text).length;
  const status: SeoCheckStatus = count >= 300 ? "pass" : "warn";
  return {
    id: "word-count",
    status,
    message:
      status === "pass"
        ? `Content has ${count} words, meeting the recommended minimum of 300.`
        : `Content has ${count} words; at least 300 are recommended.`,
    value: count,
  };
};

export const checkKeywordPlacement = (
  input: KeywordPlacementInput,
): SeoCheck<{
  title: boolean;
  description: boolean;
  slug: boolean;
  firstParagraph: boolean;
  subheading: boolean;
}> => {
  const keyword = input.keyword.trim();
  const paragraphs = extractedTextForTag(input.html, "p");
  const subheadings = [
    ...extractedTextForTag(input.html, "h2"),
    ...extractedTextForTag(input.html, "h3"),
    ...extractedTextForTag(input.html, "h4"),
  ];
  const value = {
    title: containsPhrase(input.title, keyword),
    description: containsPhrase(input.description, keyword),
    slug: containsPhrase(input.slug, keyword),
    firstParagraph: containsPhrase(paragraphs[0] ?? "", keyword),
    subheading: subheadings.some((heading) => containsPhrase(heading, keyword)),
  };
  const placedCount = Object.values(value).filter(Boolean).length;
  const status: SeoCheckStatus =
    !keyword || placedCount === 0
      ? "fail"
      : placedCount === Object.keys(value).length
        ? "pass"
        : "warn";
  const missing = Object.entries(value)
    .filter(([, present]) => !present)
    .map(([location]) => location);

  return {
    id: "keyword-placement",
    status,
    message:
      status === "pass"
        ? "The focus keyword is present in the title, description, slug, first paragraph, and a subheading."
        : !keyword
          ? "A focus keyword is required to check keyword placement."
          : `Add the focus keyword to: ${missing.join(", ")}.`,
    value,
  };
};

export const checkHeadings = (
  html: string,
): SeoCheck<{ h1Count: number; levels: number[]; skippedLevels: number[] }> => {
  const sanitized = sanitizeHtml(html, {
    allowedTags: ["h1", "h2", "h3", "h4"],
    allowedAttributes: {},
  });
  const headings = Array.from(
    sanitized.matchAll(/<h([1-4])\b[^>]*>/gi),
    (match) => Number(match[1]),
  );
  const h1Count = headings.filter((level) => level === 1).length;
  const skippedLevels: number[] = [];
  let previousLevel = 0;

  for (const level of headings) {
    if (previousLevel > 0 && level > previousLevel + 1) {
      for (let skipped = previousLevel + 1; skipped < level; skipped += 1) {
        if (!skippedLevels.includes(skipped)) skippedLevels.push(skipped);
      }
    }
    previousLevel = level;
  }

  const status: SeoCheckStatus =
    h1Count !== 1 || skippedLevels.length > 0 ? "fail" : "pass";
  const message =
    h1Count !== 1
      ? `Use exactly one H1 heading; found ${h1Count}.`
      : skippedLevels.length > 0
        ? `Heading hierarchy skips level${skippedLevels.length > 1 ? "s" : ""} ${skippedLevels.join(", ")}.`
        : "Heading hierarchy has exactly one H1 and no skipped levels.";

  return {
    id: "headings",
    status,
    message,
    value: { h1Count, levels: headings, skippedLevels },
  };
};

export const countLinks = (
  html: string,
  siteDomain: string,
): SeoCheck<{ internal: number; external: number }> => {
  let internal = 0;
  let external = 0;
  let normalizedDomain = "";
  try {
    normalizedDomain = new URL(
      siteDomain.includes("://") ? siteDomain : `https://${siteDomain}`,
    ).hostname.toLocaleLowerCase();
  } catch {
    return {
      id: "links",
      status: "warn",
      message: "Provide a valid site domain to classify links.",
      value: { internal, external },
    };
  }

  const sanitized = sanitizeHtml(html, {
    allowedTags: ["a"],
    allowedAttributes: { a: ["href"] },
  });
  for (const match of sanitized.matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>/gi)) {
    const href = match[1];
    if (!href) continue;
    try {
      const url = new URL(href, `https://${normalizedDomain}`);
      const hostname = url.hostname.toLowerCase();
      if (
        url.protocol === "mailto:" ||
        (hostname !== normalizedDomain &&
          !hostname.endsWith(`.${normalizedDomain}`))
      ) {
        external += 1;
      } else {
        internal += 1;
      }
    } catch {
      internal += 1;
    }
  }

  const total = internal + external;
  const status: SeoCheckStatus = total > 0 ? "pass" : "warn";
  return {
    id: "links",
    status,
    message:
      total > 0
        ? `Found ${internal} internal and ${external} external link${total === 1 ? "" : "s"}.`
        : "Add relevant internal and external links where appropriate.",
    value: { internal, external },
  };
};

const lengthCheck = (
  id: "title-length" | "description-length",
  value: string,
  minimum: number,
  maximum: number,
  label: string,
): SeoCheck<number> => {
  const length = value.trim().length;
  const status: SeoCheckStatus =
    length >= minimum && length <= maximum ? "pass" : "warn";
  return {
    id,
    status,
    message:
      status === "pass"
        ? `${label} is ${length} characters, within the recommended ${minimum} to ${maximum} range.`
        : `${label} is ${length} characters; aim for ${minimum} to ${maximum} characters.`,
    value: length,
  };
};

export const checkTitleLength = (title: string): SeoCheck<number> =>
  lengthCheck("title-length", title, 50, 60, "SEO title");

export const checkDescriptionLength = (description: string): SeoCheck<number> =>
  lengthCheck("description-length", description, 140, 160, "Meta description");

export const checkParagraphLength = (
  html: string,
  maximumWords = 150,
): SeoCheck<{ paragraphCount: number; longParagraphs: number[] }> => {
  const paragraphs = extractedTextForTag(html, "p");
  const longParagraphs = paragraphs.flatMap((paragraph, index) =>
    wordTokens(paragraph).length > maximumWords ? [index + 1] : [],
  );
  const status: SeoCheckStatus = longParagraphs.length > 0 ? "warn" : "pass";

  return {
    id: "paragraph-length",
    status,
    message:
      status === "pass"
        ? `All ${paragraphs.length} paragraphs are within the recommended ${maximumWords}-word limit.`
        : `Paragraph${longParagraphs.length > 1 ? "s" : ""} ${longParagraphs.join(", ")} exceed${longParagraphs.length === 1 ? "s" : ""} ${maximumWords} words.`,
    value: { paragraphCount: paragraphs.length, longParagraphs },
  };
};

export const analyzeContent = (
  input: SeoAnalysisInput,
  siteDomain = "example.com",
): SeoCheck[] => {
  const text = extractVisibleText(input.html);
  return [
    checkKeywordPlacement(input),
    calculateKeywordDensity(text, input.keyword),
    checkHeadings(input.html),
    checkTitleLength(input.title),
    checkDescriptionLength(input.description),
    countWords(text),
    countLinks(input.html, siteDomain),
    checkParagraphLength(input.html),
  ];
};

const scoreWeights: Readonly<Record<string, number>> = {
  "keyword-placement": 20,
  "keyword-density": 15,
  headings: 15,
  "title-length": 10,
  "description-length": 10,
  "word-count": 10,
  links: 10,
  "paragraph-length": 10,
};

export const calculateSeoScore = (checks: readonly SeoCheck[]): number => {
  const byId = new Map(checks.map((check) => [check.id, check]));
  const score = Object.entries(scoreWeights).reduce((total, [id, weight]) => {
    const check = byId.get(id);
    if (!check || check.status === "fail") return total;
    return total + (check.status === "pass" ? weight : weight / 2);
  }, 0);
  return Math.round(score);
};
