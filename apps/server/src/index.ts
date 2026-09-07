import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@kosh-app/api/context";
import { appRouter } from "@kosh-app/api/routers/index";
import { auth } from "@kosh-app/auth";
import { env } from "@kosh-app/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    exposeHeaders: ["set-auth-token"],
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context });
    },
  }),
);

app.get("/", (c) => {
  return c.text("OK");
});

// Apple Team ID + bundle identifier, listed in the AASA under `webcredentials`.
// Required for iOS passkeys so the platform can validate the Relying Party ID
// against this app. Replace with the real Team ID (Settings > Account in
// developer.apple.com) before deploying.
const APPLE_WEB_CREDENTIAL_APP_ID = "<TEAM_ID>.com.koshapp.app";

app.get("/.well-known/assetlinks.json", (c) => {
  return c.json([
    {
      relation: [
        "delegate_permission/common.handle_all_urls",
        "delegate_permission/common.get_login_creds",
      ],
      target: {
        namespace: "android_app",
        package_name: "com.koshapp.app",
        sha256_cert_fingerprints: [
          // EAS release keystore (from `eas credentials`).
          "84:D3:97:FF:2B:3D:7B:C6:2B:00:A1:BD:54:F1:C2:58:A0:38:48:A3:01:F9:68:58:B9:CE:2D:8B:41:0F:32:D0",
          // Android debug keystore (`~/.android/debug.keystore`) — matches
          // dev builds installed via `expo run:android`.
          "FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C",
        ],
      },
    },
  ]);
});

app.get("/.well-known/apple-app-site-association", (c) => {
  return c.json({
    applinks: {},
    webcredentials: {
      apps: [APPLE_WEB_CREDENTIAL_APP_ID],
    },
  });
});

export default app;
