# Cool Library (Next.js)

Book management app rebuilt on Next.js: librarians sign up, catalog books with
cover images, maintain author profiles and free-form tags, register members and
lend books to them. Functionally equivalent to the original `cool_library`
(Express + React SPA), rewritten as a single Next.js app using React Server
Components and Server Actions.

## Stack

- **Framework:** Next.js 16 (App Router, Cache Components / Partial Prerendering, Turbopack), React 19
- **Data:** SQLite via `@libsql/client` + Drizzle ORM, SQL migrations applied at boot
- **Auth:** email/password (bcrypt) with a signed, httpOnly session cookie (`jose`)
- **Storage:** MinIO (S3-compatible) accessed only through presigned URLs
- **Styling:** Tailwind CSS v4
- **Orchestration:** Docker Compose (multi-stage image from Next's standalone output)

## Run

```bash
docker compose up --build
```

| Service       | URL                                            |
| ------------- | ---------------------------------------------- |
| App           | http://localhost:4900                          |
| MinIO API     | http://localhost:4902                          |
| MinIO console | http://localhost:4903 (`minioadmin` / `minioadmin`) |

Stop with `docker compose down`. Persisted data lives under `./data` (gitignored).

Hot-reload development inside Docker:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Or run the app directly on the host (MinIO still from compose):

```bash
docker compose up minio minio-init -d
cd web && cp .env.example .env.local && npm install && npm run dev
```

## How it is built

### Rendering model

Every page is a Server Component. With Cache Components enabled, each route
ships a prerendered static shell (header, skeletons) and streams the parts that
depend on the request (session cookie, `searchParams`, `params`, database reads)
behind `<Suspense>` boundaries. The navbar reads the session in its own boundary
so the layout never blocks on it.

- Listing pages keep search, filters, view mode and paging in the URL. The
  search box (`SearchBar`) debounces into `router.replace`, and the Server
  Component re-renders with fresh data.
- Client Components are used only where interactivity needs them: forms,
  typeahead pickers, dropdown menus, the loan panel.

### Mutations

All writes are Server Actions in `web/src/lib/actions/*`. Forms use
`useActionState` for pending/error state and the actions `redirect()` on
success after calling `revalidatePath` for the affected routes. Every action
re-checks the session (and ownership where relevant) close to the data; the
`proxy.ts` redirect for protected routes is only an optimistic cookie check.

### Data access

`web/src/lib/data/*` contains the queries and the DTO serializers (the only
code that touches Drizzle for reads). `web/src/lib/auth/dal.ts` exposes
`getSessionUser()` (memoized per request with `React.cache`) and
`requireUser()`. The schema lives in `web/src/lib/db/schema.ts`; migrations are
generated with `npm run db:generate` into `web/drizzle/` and applied on server
start from `src/instrumentation.ts`.

### Uploads

Covers and author pictures never flow through the Next server:

1. The form calls the `requestUploadUrl` Server Action, which returns a
   presigned `PUT` URL (valid 5 min) and the object key.
2. The browser `PUT`s the file directly to MinIO (progress bar via XHR).
3. The form then submits with the key; the save action stores only the key.

Reads also use presigned `GET` URLs computed by the serializers, so the bucket
stays private. The server uses `S3_ENDPOINT` (`minio:9000` inside Docker) for
its own calls and `S3_PUBLIC_ENDPOINT` (`localhost:4902`) for the URLs handed
to the browser.

### Menu

The header groups navigation by task: **Catalog** (Books, Authors) and
**Circulation** (Loans, Members, signed-in only), with the active section
highlighted, a **+ New** dropdown (book, author, member) and an account menu
with log out. On small screens it collapses into a grouped panel.

## Screens

| Route                 | Access     | Notes                                                         |
| --------------------- | ---------- | ------------------------------------------------------------- |
| `/`                   | public     | Books: search, tag filter, available only, grid/list, paging  |
| `/books/:id`          | public     | Detail + availability; lend / return / extend when signed in  |
| `/books/new`, `/:id/edit` | signed in (edit: owner) | Cover upload, author picker, tags             |
| `/authors`, `/authors/:id` | public | Search, tag filter, profile with its books                    |
| `/authors/new`, `/:id/edit` | signed in | Picture upload, tags                                     |
| `/members`, `/members/:id` | signed in | Search, detail with loans on hand and history            |
| `/members/new`, `/:id/edit` | signed in |                                                          |
| `/loans`              | signed in  | On loan / overdue / returned / all, mark returned             |
| `/login`, `/signup`   | public     |                                                               |

## Configuration

See `web/.env.example`. Notable variables:

- `SESSION_SECRET` – sign-in cookie secret (change it outside development)
- `SESSION_COOKIE_SECURE` – set `true` when serving over HTTPS
- `S3_PUBLIC_ENDPOINT` – override when exposing MinIO through a tunnel; the
  browser must be able to reach it and `MINIO_API_CORS_ALLOW_ORIGIN` must
  include the app's origin

## Layout

```
docker-compose.yml       MinIO + bucket init + app (production image)
docker-compose.dev.yml   override for hot reload
web/
  src/app/               routes (RSC pages, route handlers)
  src/components/        UI (server components by default, "use client" where needed)
  src/lib/actions/       Server Actions
  src/lib/data/          queries + serializers
  src/lib/auth/          session cookie, DAL, password hashing
  src/lib/db/            Drizzle schema, client, migration runner
  src/proxy.ts           optimistic auth redirects
  drizzle/               generated SQL migrations
```
