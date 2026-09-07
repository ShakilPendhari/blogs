# Portfolio Blog API

An Express and MongoDB API for publishing portfolio articles. The public portfolio only needs the read endpoints; database credentials and admin credentials must remain on the server.

## Local setup

Install dependencies and start the API:

```powershell
npm install
npm run dev
```

The local API is available at `http://localhost:5000/api`. Seed example articles with `npm run seed` if needed.

The public article index is available at `http://localhost:5000/`. Individual articles use clean URLs such as `http://localhost:5000/my-article-slug`. The index keeps search, topic filters, and pagination in the URL so filtered views can be shared.

SEO endpoints are available at `/robots.txt` and `/sitemap.xml`. After deployment, submit the full sitemap URL to Google Search Console or another search engine webmaster tool.

## Environment variables

The server `.env` only needs these values:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<database>
ADMIN_PASSWORD_HASH=<bcrypt-hash>
ADMIN_JWT_SECRET=<long-random-secret>
CLIENT_URL=http://localhost:3000
PORT=5000
BLOG_SITE_URL=https://blog.shakilpendhari.com
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=portfolio-blog-images
S3_ACCESS_KEY_ID=<storage-access-key>
S3_SECRET_ACCESS_KEY=<storage-secret>
S3_PUBLIC_BASE_URL=https://images.example.com
```

`MONGODB_URI`, `ADMIN_PASSWORD_HASH`, and `ADMIN_JWT_SECRET` are server-only. `PORT` is optional locally and should normally be omitted on Railway because Railway provides it. `CLIENT_URL` may contain multiple comma-separated frontend origins, without trailing slashes. Do not add frontend variables such as `REACT_APP_API_URL` to this backend.

`BLOG_SITE_URL` is the public blog main-page URL used in API link fields. Set it to the deployed blog site, without a trailing slash. For example, with `BLOG_SITE_URL=https://blog.shakilpendhari.com`, an article returns `links.article=https://blog.shakilpendhari.com/article-slug` and `links.index=https://blog.shakilpendhari.com`.

Image uploads use S3-compatible object storage. Cloudflare R2 is a good low-cost/free-allowance option: create a bucket, enable a public custom domain (or public bucket URL), create an API token with object read/write access, and set the `S3_*` variables above. AWS S3 also works; omit `S3_ENDPOINT`, use your AWS region, and set `S3_PUBLIC_BASE_URL` to the bucket's public HTTPS base URL. Never expose the access key or secret in frontend code.

For the deployed portfolio, set this Railway variable exactly:

```env
CLIENT_URL=https://shakilpendhari.github.io,https://portfolio.shakilpendhari.com
```

## Railway deployment

1. Push this repository to GitHub and create a Railway project from the repository.
2. Add the variables above in Railway under **Variables**. Do not commit `.env`.
3. Set `MONGODB_URI` in MongoDB Atlas and allow Railway to connect through Atlas Network Access.
4. Use the default start command, `npm start`. Railway detects the Node.js project automatically.
5. Generate a Railway public domain and verify `https://<railway-domain>/api/health` returns `{ "status": "ok" }`.
6. Set `CLIENT_URL` to the deployed portfolio URL and redeploy if the frontend is hosted separately.

Railway supplies `PORT`; the application already listens on that value. The deployed API base URL for the portfolio will be `https://<railway-domain>/api`.

The portfolio frontend must use the API base URL ending in `/api`, for example `https://blog.shakilpendhari.com/api`. Requests should therefore be `https://blog.shakilpendhari.com/api/blogs` and `https://blog.shakilpendhari.com/api/blogs/categories`. Calling `/blogs` without `/api` returns `404 Route not found.`

## API contract

- `GET /api/health` returns API health.
- `GET /api/blogs` returns paginated published blogs, newest first. Use `?page=1&limit=10&search=hooks&category=Frontend` to filter and paginate.
- `GET /api/blogs/latest` returns the newest published blog for a portfolio homepage card.
- `GET /api/blogs/categories` returns available categories.
- `POST /api/blogs/categories` creates a category and requires admin authentication with `{ "name": "Testing" }`.
- `DELETE /api/blogs/categories/:name` deletes an unused category and requires admin authentication.
- `GET /api/blogs/:slug` returns one published blog with `links.index` for the main blog page and `links.article` for its specific reading page.
- `POST /api/auth/login` accepts `{ "password": "..." }` and returns an admin JWT.
- `POST /api/auth/logout` revokes a bearer token.
- `GET /api/blogs/admin/all` requires admin authentication.
- `POST /api/blogs`, `PUT /api/blogs/:id`, and `DELETE /api/blogs/:id` require `Authorization: Bearer <token>`.

Blog creation requires `title`, `excerpt`, and `content`. Optional fields are `slug`, `coverImage`, `githubUrl`, `deployedUrl`, `readingTime`, `category`, `tags`, `published`, and `publishedAt`. `content` is Markdown. Admin listing supports `page`, `limit`, `search`, `category`, and `published` filters.

Portfolio integration example:

```javascript
const response = await fetch(`${BLOG_API_URL}/blogs/latest`);
const { blog, links } = await response.json();
latestTitle.textContent = blog.title;
readMore.href = links.index;
latestCard.addEventListener('click', () => { window.location.href = links.article; });
```

Categories can also be created and deleted from the admin panel. The initial built-in categories are inserted automatically the first time the category endpoint is used. A category cannot be deleted while a blog still uses it.