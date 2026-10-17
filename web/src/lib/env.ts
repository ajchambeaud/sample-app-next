import "server-only";

function num(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Server-side configuration. Every value has a development default so the app
 * boots with `docker compose up` and `next dev` without a .env file; override
 * them in production.
 */
export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "file:./data/library.sqlite",
  session: {
    secret: process.env.SESSION_SECRET ?? "dev-secret-change-me",
    cookieName: "cool_library_session",
    maxAgeSeconds: 7 * 24 * 60 * 60,
    secure: process.env.SESSION_COOKIE_SECURE === "true",
  },
  s3: {
    endpoint: process.env.S3_ENDPOINT ?? "http://localhost:4902",
    publicEndpoint: process.env.S3_PUBLIC_ENDPOINT ?? "http://localhost:4902",
    region: process.env.S3_REGION ?? "us-east-1",
    bucket: process.env.S3_BUCKET ?? "covers",
    accessKey: process.env.S3_ACCESS_KEY ?? "minioadmin",
    secretKey: process.env.S3_SECRET_KEY ?? "minioadmin",
    presignPutTtl: num(process.env.PRESIGN_PUT_TTL, 300),
    presignGetTtl: num(process.env.PRESIGN_GET_TTL, 600),
  },
};
