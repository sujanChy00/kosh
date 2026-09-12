import { isAndroid } from "@/constants/platform";
import * as Burnt from "burnt";

interface ToastOptions {
  title: string;
  description?: string;
}

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
