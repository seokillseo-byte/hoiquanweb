import { betterAuth } from "better-auth";
import { getMigrations } from "better-auth/db/migration";

const authInstances = new WeakMap();

export function getAuth(env, request) {
  if (!env.DB || (typeof env.DB !== "object" && typeof env.DB !== "function")) {
    throw new Error("DB_NOT_CONFIGURED");
  }

  const isTest = env.TEST_MODE === "true";
  const baseURL = env.AUTH_BASE_URL || (isTest ? new URL(request.url).origin : "");
  if (!baseURL) {
    throw new Error("AUTH_BASE_URL_NOT_CONFIGURED");
  }

  const configuredOrigins = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
  if (!isTest && configuredOrigins.length === 0) {
    throw new Error("ALLOWED_ORIGINS_NOT_CONFIGURED");
  }

  let auth = authInstances.get(env.DB);
  if (!auth) {
    const origins = [...new Set(configuredOrigins)];
    if (isTest) origins.push("http://localhost:8787");
    auth = betterAuth({
      appName: "Hoi Quan Web",
      baseURL,
      basePath: "/api/v1/auth",
      database: env.DB,
      trustedOrigins: [...new Set(origins)],
      emailAndPassword: {
        enabled: true,
        minPasswordLength: 12,
        maxPasswordLength: 128
      },
      advanced: {
        // Insecure cookies are permitted only in the isolated local test harness.
        useSecureCookies: isTest && env.AUTH_USE_SECURE_COOKIES === "false" ? false : true,
        defaultCookieAttributes: {
          httpOnly: true,
          sameSite: "lax",
          secure: !(isTest && env.AUTH_USE_SECURE_COOKIES === "false")
        }
      }
    });
    authInstances.set(env.DB, auth);
  }
  return auth;
}

export async function migrateAuthDatabase(auth) {
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();
}
