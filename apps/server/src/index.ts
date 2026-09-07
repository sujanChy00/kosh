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

app.get("/.well-known/assetlinks.json", (c) => {
  return c.json([
    {
      relation: ["delegate_permission/common.get_login_creds"],
      target: {
        namespace: "android_app",
        package_name: "com.koshapp.app",
        sha256_cert_fingerprints: [
          "84:D3:97:FF:2B:3D:7B:C6:2B:00:A1:BD:54:F1:C2:58:A0:38:48:A3:01:F9:68:58:B9:CE:2D:8B:41:0F:32:D0",
        ],
      },
    },
  ]);
});

export default app;
