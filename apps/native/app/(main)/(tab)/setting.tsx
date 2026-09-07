import { ActivityIndicator, View } from "react-native";

import { Container } from "@/components/container";
import { StyledSymbolView } from "@/components/styled-symbol-view";
import { ThemedText } from "@/components/themed-text";
import { Card } from "@/components/ui/card";
import { FieldDescription } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { SwitchInput } from "@/components/ui/switch-input";
import { TextInput } from "@/components/ui/text-input";
import { usePasskeyBiometrics } from "@/hooks/use-passkey-biometrics";

const SettingsScreen = () => {
  const { isAvailable, isEnabled, isPending, toggle } = usePasskeyBiometrics();

  return (
    <Container className="p-6">
      <View className="mb-6 py-4">
        <ThemedText className="text-3xl font-medium text-foreground">
          Settings
        </ThemedText>
      </View>

      <Card className="p-3">
        <View className="flex-row items-center gap-3 p-2">
          <StyledSymbolView
            name={{
              ios: "faceid",
              android: "fingerprint",
            }}
            size={28}
          />
          <View className="flex-1">
            <ThemedText className="text-base font-medium text-foreground">
              Biometric Login
            </ThemedText>
            <FieldDescription>
              {isAvailable
                ? "Unlock Kosh with Face ID or your fingerprint. A passkey is saved securely on this device."
                : "Face ID or fingerprint is not set up on this device."}
            </FieldDescription>
          </View>
          {isPending ? (
            <ActivityIndicator size="small" />
          ) : (
            <SwitchInput
              value={isEnabled}
              disabled={!isAvailable}
              onValueChange={toggle}
            />
          )}
        </View>

        <Separator className="my-3" />

        <View className="p-2">
          <FieldDescription>
            Enabled by default on devices with Face ID, Touch ID, or fingerprint
            support. Your biometrics never leave this device — only the passkey
            used to verify them.
          </FieldDescription>
        </View>
      </Card>
      <View className="px-4">
        <TextInput />
      </View>
    </Container>
  );
};

export default SettingsScreen;
