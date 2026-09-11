import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "EXPO_PUBLIC_",
  client: {
    EXPO_PUBLIC_SERVER_URL: z.url(),
    EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),
    EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET: z.string().min(1),
  },
  runtimeEnv: {
    EXPO_PUBLIC_SERVER_URL: process.env.EXPO_PUBLIC_SERVER_URL,
    EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME:
      process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME,
    EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET:
      process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  },
  emptyStringAsUndefined: true,
});
