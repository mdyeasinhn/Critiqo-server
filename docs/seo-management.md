# SEO management API

Admin endpoints accept the existing JWT in the `Authorization` header and
require the `ADMIN` role. The `/api/v1` prefixed routes are also available
alongside the requested `/api` paths.

| Method | Path                           | Description                                            |
| ------ | ------------------------------ | ------------------------------------------------------ |
| GET    | `/api/admin/seo`               | List pages, blog posts, and reviews with SEO status    |
| GET    | `/api/admin/seo/:type/:id`     | Get one content item and its SEO metadata              |
| PUT    | `/api/admin/seo/:type/:id`     | Update content, SEO metadata, schema markup, or images |
| GET    | `/api/admin/site-settings`     | Read site-wide SEO defaults                            |
| PUT    | `/api/admin/site-settings`     | Update site-wide SEO defaults                          |
| POST   | `/api/admin/content/:type`     | Create a blog post or review                           |
| PUT    | `/api/admin/content/:type/:id` | Update a blog post or review                           |
| GET    | `/api/admin/images/:type/:id`  | List content images with SEO diagnostics               |
| PATCH  | `/api/admin/images/:imageId`   | Update image metadata and its HTML attributes          |

Supported SEO `:type` values are `page`, `blog`, and `review`. The previous
`blogPost` type remains accepted as a backward-compatible alias; list responses
use the canonical `blog` type. SEO titles are
limited to 60 characters, descriptions to 160 characters, and content titles
to 255 characters. Slugs must contain lowercase letters, digits, and single
hyphens and must be unique across all content types. Canonical and image URLs
must use HTTP or HTTPS.

Content save requests include `title`, `slug`, and `contentHtml`; review saves
also include `categoryId` and `rating`. HTML is sanitized to the editor
allowlist before storage. Images embedded in HTML are stored in `ContentImage`
records and synchronized when the HTML is replaced. Image diagnostics recommend
alt text between 10 and 125 characters and flag repeated focus keywords and
generic file names.

Public SEO endpoints expose resolved metadata for published content and the
site sitemap and robots rules:

- `GET /api/content/:type/:slug`
- `GET /api/seo/:type/:slug`
- `GET /api/seo/sitemap`
- `GET /api/seo/robots`
- `POST /api/admin/seo/analyze` accepts `html`, `seoTitle`,
  `metaDescription`, `slug`, and `focusKeyword`; it returns an explained check
  list and a deterministic score. The endpoint is limited to 20 requests per
  15 minutes per client.

Run `npm run seed` to idempotently initialize the default `SiteSettings` row.
