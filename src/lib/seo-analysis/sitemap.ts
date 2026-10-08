export interface SitemapCandidate {
  url: string;
  lastModified: Date;
  noindex: boolean;
}

export interface SitemapEntry {
  url: string;
  lastModified: Date;
}

export const excludeNoindexFromSitemap = (
  entries: SitemapCandidate[],
): SitemapEntry[] =>
  entries
    .filter((entry) => !entry.noindex)
    .map(({ url, lastModified }) => ({ url, lastModified }));
