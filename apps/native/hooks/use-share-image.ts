import { errorToast } from "@/utils/toast";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useCallback, useState } from "react";
import { useHaptics } from "./use-haptics";

export const useShareImage = (image: string | undefined) => {
  const haptics = useHaptics();
  const [isDownloading, setIsDownloading] = useState(false);
  const downloadImage = useCallback(async () => {
    if (!image || isDownloading) return;

    haptics("selection");
    setIsDownloading(true);

    let destFile: File | null = null;

    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        errorToast({ title: "Sharing isn't available on this device" });
        return;
      }

      destFile = await File.downloadFileAsync(
        image,
        new File(Paths.cache, `kosh-image-${Date.now()}.jpg`),
      );

      await Sharing.shareAsync(destFile.uri, {
        mimeType: "image/jpeg",
        dialogTitle: "Save image",
        UTI: "public.jpeg",
      });

      haptics("success");
    } catch (error) {
      haptics("error");
      errorToast({
        title: error instanceof Error ? error.message : "Couldn't save image",
      });
    } finally {
      if (destFile) {
        try {
          destFile.delete();
        } catch {
          // Already gone or inaccessible - nothing to clean up.
        }
      }
      setIsDownloading(false);
    }
  }, [image, isDownloading, haptics]);

  return { downloadImage, isDownloading };
};
