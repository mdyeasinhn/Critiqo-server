# SEO management API

Admin endpoints accept the existing JWT in the `Authorization` header and
require the `ADMIN` role. The `/api/v1` prefixed routes are also available
alongside the requested `/api` paths.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/admin/seo` | List pages, blog posts, and reviews with SEO status |
| GET | `/api/admin/seo/:type/:id` | Get one content item and its SEO metadata |
| PUT | `/api/admin/seo/:type/:id` | Update content, SEO metadata, schema markup, or images |
| GET | `/api/admin/site-settings` | Read site-wide SEO defaults |
| PUT | `/api/admin/site-settings` | Update site-wide SEO defaults |

Supported `:type` values are `page`, `blogPost`, and `review`. SEO titles are
limited to 60 characters, descriptions to 160 characters, and content titles
to 255 characters. Slugs must contain lowercase letters, digits, and single
hyphens and must be unique across all content types. Canonical and image URLs
must use HTTP or HTTPS.

Public SEO endpoints expose resolved metadata for published content and the
site sitemap and robots rules:

- `GET /api/seo/:type/:slug`
- `GET /api/seo/sitemap`
- `GET /api/seo/robots`

Run `npm run seed` to idempotently initialize the default `SiteSettings` row.
