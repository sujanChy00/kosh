import { SafeAreaProvider } from "react-native-safe-area-context";

import type { IToastProvider } from "./Toast.types";
import { Toaster } from "./Toaster";

function ToastProvider({ children, ...toasterProps }: IToastProvider) {
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <Toaster {...toasterProps} />
    </SafeAreaProvider>
  );
}

export { ToastProvider };
