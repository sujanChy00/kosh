import { env } from "@kosh-app/env/native";
import { File } from "expo-file-system";

const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;

export const isRemoteImage = (value?: string | null) =>
  !!value && /^https?:\/\//i.test(value);

export type CloudinaryUpload = {
  url: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
};

async function upload(uri: string, folder: string): Promise<CloudinaryUpload> {
  const file = new File(uri);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", folder);

  const response = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as {
    secure_url?: string;
    width?: number;
    height?: number;
    bytes?: number;
    format?: string;
    error?: { message?: string };
  };

  if (!response.ok || !data.secure_url) {
    throw new Error(data.error?.message || "Failed to upload image");
  }

  return {
    url: data.secure_url,
    width: data.width,
    height: data.height,
    bytes: data.bytes,
    format: data.format,
  };
}

export async function uploadToCloudinary(uri: string): Promise<string> {
  return upload(uri, "profiles").then((result) => result.url);
}

/** Chat images live in their own folder so they can be lifecycle-managed apart from profile photos. */
export function uploadChatImage(uri: string): Promise<CloudinaryUpload> {
  return upload(uri, "chat");
}
