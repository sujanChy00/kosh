import { usePasskeyBiometrics } from "@/hooks/use-passkey-biometrics";
import { ListItem, Switch, Text } from "@expo/ui";
import { CircularProgressIndicator } from "@expo/ui/jetpack-compose";
import { size } from "@expo/ui/jetpack-compose/modifiers";
import { useCSSVariable } from "uniwind";

export const LoginBiometricEnabler = () => {
  const [mutedColor] = useCSSVariable(["--color-muted"]) as [string];
  const { isAvailable, isEnabled, isPending, toggle } = usePasskeyBiometrics();
  return (
    <ListItem>
      <Text
        textStyle={{
          fontFamily: "notosans-regular",
          fontSize: 15,
        }}
      >
        Biometric Login
      </Text>
      <ListItem.Supporting>
        <Text
          textStyle={{
            fontSize: 12,
            color: mutedColor,
          }}
        >
          {isAvailable
            ? "Unlock Kosh with Face ID or your fingerprint. \nA passkey is saved securely on this device."
            : "Face ID or fingerprint is not set up on this device."}
        </Text>
      </ListItem.Supporting>
      <ListItem.Trailing>
        {isPending ? (
          <CircularProgressIndicator
            strokeWidth={3}
            modifiers={[size(25, 25)]}
          />
        ) : (
          <Switch
            onValueChange={toggle}
            value={isEnabled}
            disabled={!isAvailable}
          />
        )}
      </ListItem.Trailing>
    </ListItem>
  );
};
