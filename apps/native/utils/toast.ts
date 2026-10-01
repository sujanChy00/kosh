import { isAndroid } from "@/constants/platform";
import * as Burnt from "burnt";

interface ToastOptions {
  title: string;
  description?: string;
}

/**
 * Neutral, non-haptic notice.
 *
 * For states that are informative rather than wrong - a quote pointing at a
 * deleted message, say. `errorToast` reads as a failure, and an error haptic
 * for something the user simply cannot do is misleading.
 */
export const toast = (options: ToastOptions) => {
  if (isAndroid) {
    Burnt.toast({
      title: options.description ?? options.title,
      shouldDismissByDrag: true,
    });
    return;
  }

  Burnt.toast({
    title: options.title,
    message: options.description,
    shouldDismissByDrag: true,
  });
};

export const successToast = (options: ToastOptions) => {
  if (isAndroid) {
    Burnt.toast({
      title: options.description ?? options.title,
      haptic: "success",
      shouldDismissByDrag: true,
      preset: "done",
    });

    return;
  }

  Burnt.toast({
    title: options.title,
    message: options.description,
    haptic: "success",
    shouldDismissByDrag: true,
    preset: "done",
  });
};

export const errorToast = (options: ToastOptions) => {
  if (isAndroid) {
    Burnt.toast({
      title: options.description ?? options.title,
      haptic: "error",
      shouldDismissByDrag: true,
      preset: "done",
    });
    return;
  }
  Burnt.toast({
    title: options.title,
    message: options.description,
    haptic: "error",
    shouldDismissByDrag: true,
    preset: "error",
  });
};
