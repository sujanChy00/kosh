import { File } from "expo-file-system";
import { env } from "@kosh-app/env/native";

const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;

export const isRemoteImage = (value?: string | null) =>
  !!value && /^https?:\/\//i.test(value);

export async function uploadToCloudinary(uri: string): Promise<string> {
  const file = new File(uri);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", "profiles");

  const response = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as {
    secure_url?: string;
    error?: { message?: string };
  };

  if (!response.ok || !data.secure_url) {
    throw new Error(data.error?.message || "Failed to upload image");
  }

  return data.secure_url;
}