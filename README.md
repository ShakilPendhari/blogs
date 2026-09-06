# Portfolio Blog API

An Express and MongoDB API for publishing portfolio articles. The public portfolio only needs the read endpoints; database credentials and admin credentials must remain on the server.

## Local setup

Install dependencies and start the API:

```powershell
npm install
npm run dev
```

The local API is available at `http://localhost:5000/api`. Seed example articles with `npm run seed` if needed.

## Environment variables

The server `.env` only needs these values:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<database>
ADMIN_PASSWORD_HASH=<bcrypt-hash>
ADMIN_JWT_SECRET=<long-random-secret>
CLIENT_URL=http://localhost:3000
PORT=5000
```

`MONGODB_URI`, `ADMIN_PASSWORD_HASH`, and `ADMIN_JWT_SECRET` are server-only. `PORT` is optional locally and should normally be omitted on Railway because Railway provides it. `CLIENT_URL` may contain multiple comma-separated frontend origins, without trailing slashes. Do not add frontend variables such as `REACT_APP_API_URL` to this backend.

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

The portfolio frontend must use the API base URL ending in `/api`, for example `https://blogs.shakilpendhari.com/api`. Requests should therefore be `https://blogs.shakilpendhari.com/api/blogs` and `https://blogs.shakilpendhari.com/api/blogs/categories`. Calling `/blogs` without `/api` returns `404 Route not found.`

## API contract

- `GET /api/health` returns API health.
- `GET /api/blogs` returns published blogs, newest first. Add `?category=Frontend` to filter by category.
- `GET /api/blogs/categories` returns available categories.
- `GET /api/blogs/:slug` returns one published blog.
- `POST /api/auth/login` accepts `{ "password": "..." }` and returns an admin JWT.
- `POST /api/auth/logout` revokes a bearer token.
- `GET /api/blogs/admin/all` requires admin authentication.
- `POST /api/blogs`, `PUT /api/blogs/:id`, and `DELETE /api/blogs/:id` require `Authorization: Bearer <token>`.

Blog creation requires `title`, `excerpt`, and `content`. Optional fields are `slug`, `coverImage`, `readingTime`, `category`, `tags`, `published`, and `publishedAt`. `content` is Markdown.