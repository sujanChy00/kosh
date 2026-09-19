import { Host } from "@/components/layout/host";
import { ThemedText } from "@/components/themed-text";
import { AnimatedSpacer } from "@/components/ui/animated-spacer";
import { useAppTheme } from "@/contexts/app-theme-context";
import {
  TRANSACTION_PIN_FORM_VALUES,
  transactionPinSchema,
} from "@/form/kosh/transaction-pin-schema";
import { useForm } from "@/hooks/use-form";
import { useHaptics } from "@/hooks/use-haptics";
import { Icon } from "@expo/ui";
import {
  BasicAlertDialog,
  BasicTextField,
  Box,
  Button,
  Column,
  IconToggleButton,
  Row,
  Spacer,
  Surface,
  Text,
  TextButton,
  useNativeState,
} from "@expo/ui/jetpack-compose";
import {
  align,
  background,
  clip,
  dropShadow,
  fillMaxWidth,
  height,
  padding,
  Shapes,
  weight,
  wrapContentHeight,
  wrapContentWidth,
} from "@expo/ui/jetpack-compose/modifiers";
import { useCallback, useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
const VISIBLITY_ON = Icon.select({
  ios: "eye",
  android: require("@expo/material-symbols/visibility.xml"),
});
const VISIBLITY_OFF = Icon.select({
  ios: "eye.slash",
  android: require("@expo/material-symbols/visibility_off.xml"),
});

const UpdateTransactionPinScreen = () => {
  const haptics = useHaptics();
  const { colors } = useAppTheme();
  const [showPassword, setShowPassword] = useState(false);
  const password = useNativeState("");
  const [isVisible, setIsVisible] = useState(false);
  const form = useForm({
    defaultValues: {
      newPin: "",
      oldPin: "",
      confirmPin: "",
    } satisfies TRANSACTION_PIN_FORM_VALUES,
    validators: {
      onSubmit: transactionPinSchema,
    },

    onSubmit: () => {
      setIsVisible(true);
    },
    onSubmitInvalid: () => {
      haptics("error");
    },
  });

  const handleValueChange = useCallback(
    (value: string) => {
      "worklet";
      password.value = value;
    },
    [password],
  );

  return (
    <form.AppForm>
      <Host>
        {isVisible && (
          <BasicAlertDialog onDismissRequest={() => setIsVisible(false)}>
            <Surface
              tonalElevation={6}
              modifiers={[
                wrapContentWidth(),
                wrapContentHeight(),
                clip(Shapes.RoundedCorner(28)),
              ]}
            >
              <Column modifiers={[padding(25, 25, 25, 25)]}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "600",
                    fontFamily: "notosans-regular",
                  }}
                >
                  Enter your password
                </Text>
                <Spacer modifiers={[height(10)]} />
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "notosans-regular",
                  }}
                >
                  In order to confirm, please enter your password.
                </Text>
                <Spacer modifiers={[height(16)]} />
                <Row
                  verticalAlignment="center"
                  modifiers={[
                    clip(Shapes.RoundedCorner(16)),
                    dropShadow(Shapes.Rectangle, {
                      radius: 3,
                      spread: 0,
                      offsetX: 0,
                      offsetY: 1,
                      color: "#000000",
                      alpha: 0.1,
                    }),
                    dropShadow(Shapes.Rectangle, {
                      radius: 2,
                      spread: -1,
                      offsetX: 0,
                      offsetY: 1,
                      color: "#000000",
                      alpha: 0.1,
                    }),
                    background(colors.background),
                    fillMaxWidth(),
                  ]}
                >
                  <BasicTextField
                    autoFocus
                    value={password}
                    onValueChange={handleValueChange}
                    visualTransformation={showPassword ? "none" : "password"}
                    modifiers={[
                      weight(1),
                      clip(Shapes.RoundedCorner(16)),
                      padding(12, 16, 12, 16),
                    ]}
                  >
                    <BasicTextField.DecorationBox>
                      <Box>
                        <BasicTextField.Placeholder>
                          <Text>********</Text>
                        </BasicTextField.Placeholder>
                        <BasicTextField.InnerTextField />
                      </Box>
                    </BasicTextField.DecorationBox>
                  </BasicTextField>
                  <IconToggleButton
                    checked={showPassword}
                    onCheckedChange={setShowPassword}
                  >
                    <Icon
                      name={showPassword ? VISIBLITY_ON : VISIBLITY_OFF}
                      size={24}
                    />
                  </IconToggleButton>
                </Row>

                <Spacer modifiers={[height(24)]} />
                <Row modifiers={[align("end")]}>
                  <TextButton onClick={() => setIsVisible(false)}>
                    <Text>Cancel</Text>
                  </TextButton>
                  <Button>
                    <Text>Update</Text>
                  </Button>
                </Row>
              </Column>
            </Surface>
          </BasicAlertDialog>
        )}
      </Host>

      <ScrollView
        contentContainerClassName="p-4 pt-safe-offset-20 gap-y-10"
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <ThemedText className="text-2xl font-mono-semibold">
          Update Transaction Pin
        </ThemedText>
        <View className="gap-y-6">
          <form.AppField
            name="oldPin"
            children={(field) => (
              <field.PasswordField
                label="Old Pin"
                keyboardOptions={{
                  keyboardType: "numberPassword",
                }}
                maxLength={6}
              />
            )}
          />
          <form.AppField
            name="newPin"
            children={(field) => (
              <field.PasswordField
                label="New Pin"
                keyboardOptions={{
                  keyboardType: "numberPassword",
                }}
                maxLength={6}
              />
            )}
          />
          <form.AppField
            name="confirmPin"
            children={(field) => (
              <field.PasswordField
                label="Confirm Pin"
                keyboardOptions={{
                  keyboardType: "numberPassword",
                }}
                maxLength={6}
              />
            )}
          />
        </View>
        <AnimatedSpacer height={400} />
      </ScrollView>
      <KeyboardStickyView
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 12,
          backgroundColor: colors.background,
        }}
        offset={{
          closed: -20,
          opened: -10,
        }}
      >
        <TouchableOpacity className="py-3">
          <ThemedText className="text-center">Forgot Pin?</ThemedText>
        </TouchableOpacity>
        <form.SubmitButton>
          <ThemedText className="text-primary-foreground">Submit</ThemedText>
        </form.SubmitButton>
      </KeyboardStickyView>
    </form.AppForm>
  );
};

export default UpdateTransactionPinScreen;
