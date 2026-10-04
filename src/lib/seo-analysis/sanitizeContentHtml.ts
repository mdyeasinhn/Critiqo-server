import sanitizeHtml from "sanitize-html";

export interface ExtractedContentImage {
  url: string;
  alt: string | null;
  title: string | null;
  fileName: string | null;
  position: number;
}

const allowedTags = [
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "strong",
  "em",
  "br",
];

const allowedAttributes = {
  a: ["href", "target", "rel", "title"],
  img: ["src", "alt", "title"],
};

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags,
  allowedAttributes,
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: {
    img: ["http", "https"],
  },
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attributes) => {
      const href = attributes.href;
      if (!href || !/^https?:\/\//i.test(href)) {
        return { tagName, attribs: attributes };
      }

      const rel = new Set((attributes.rel ?? "").split(/\s+/).filter(Boolean));
      rel.add("noopener");
      rel.add("noreferrer");

      return {
        tagName,
        attribs: { ...attributes, rel: [...rel].join(" ") },
      };
    },
  },
};

const getFileName = (url: string): string | null => {
  try {
    const pathname = new URL(url).pathname;
    const fileName = pathname.slice(pathname.lastIndexOf("/") + 1);
    return fileName || null;
  } catch {
    return null;
  }
};

export const sanitizeContentHtml = (html: string): string =>
  sanitizeHtml(html, sanitizeOptions);

export const sanitizeAndExtractImages = (
  html: string,
): { html: string; images: ExtractedContentImage[] } => {
  const sanitizedHtml = sanitizeContentHtml(html);
  const images: ExtractedContentImage[] = [];

  sanitizeHtml(sanitizedHtml, {
    ...sanitizeOptions,
    transformTags: {
      ...sanitizeOptions.transformTags,
      img: (tagName, attributes) => {
        const url = attributes.src;
        if (url) {
          images.push({
            url,
            alt: attributes.alt ?? null,
            title: attributes.title ?? null,
            fileName: getFileName(url),
            position: images.length,
          });
        }
        return { tagName, attribs: attributes };
      },
    },
  });

  return { html: sanitizedHtml, images };
};

export const sanitizeAndSyncImageAttributes = (
  html: string,
  updatesByPosition: ReadonlyMap<
    number,
    { alt: string | null; title: string | null; src?: string }
  >,
): string => {
  let position = 0;
  return sanitizeHtml(html, {
    ...sanitizeOptions,
    transformTags: {
      ...sanitizeOptions.transformTags,
      img: (tagName, attributes) => {
        const update = updatesByPosition.get(position);
        position += 1;
        if (!update) return { tagName, attribs: attributes };

        const updatedAttributes = { ...attributes };
        if (update.alt === null) delete updatedAttributes.alt;
        else updatedAttributes.alt = update.alt;
        if (update.title === null) delete updatedAttributes.title;
        else updatedAttributes.title = update.title;
        if (update.src) updatedAttributes.src = update.src;

        return { tagName, attribs: updatedAttributes };
      },
    },
  });
};

export const renameImageUrl = (url: string, fileName: string): string => {
  const parsedUrl = new URL(url);
  const encodedFileName = fileName
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  parsedUrl.pathname = `${parsedUrl.pathname.slice(
    0,
    parsedUrl.pathname.lastIndexOf("/") + 1,
  )}${encodedFileName}`;
  return parsedUrl.toString();
};
