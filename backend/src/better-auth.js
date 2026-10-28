import { betterAuth } from "better-auth";
import { getMigrations } from "better-auth/db/migration";

const authInstances = new WeakMap();

export function getAuth(env, request) {
  if (!env.DB || (typeof env.DB !== "object" && typeof env.DB !== "function")) {
    throw new Error("DB_NOT_CONFIGURED");
  }
  let auth = authInstances.get(env.DB);
  if (!auth) {
    const origins = (env.ALLOWED_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean);
    if (env.TEST_MODE === "true") origins.push("http://localhost:8787");
    auth = betterAuth({
      appName: "Hoi Quan Web",
      baseURL: env.AUTH_BASE_URL || new URL(request.url).origin,
      basePath: "/api/v1/auth",
      database: env.DB,
      trustedOrigins: [...new Set(origins)],
      emailAndPassword: {
        enabled: true,
        minPasswordLength: 12,
        maxPasswordLength: 128
      },
      advanced: {
        useSecureCookies: env.AUTH_USE_SECURE_COOKIES === "false" ? false : undefined,
        defaultCookieAttributes: {
          httpOnly: true,
          sameSite: "lax",
          secure: env.AUTH_USE_SECURE_COOKIES === "false" ? false : true
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
