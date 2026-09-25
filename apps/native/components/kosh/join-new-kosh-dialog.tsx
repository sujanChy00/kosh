import { useAppTheme } from "@/contexts/app-theme-context";
import { errorToast } from "@/utils/toast";
import {
  BasicAlertDialog,
  BasicTextField,
  Box,
  Button,
  Column,
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
  fillMaxWidth,
  height,
  padding,
  Shapes,
  wrapContentHeight,
  wrapContentWidth,
} from "@expo/ui/jetpack-compose/modifiers";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { Host } from "../layout/host";

interface Props {
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  onConfirm: (value: string) => void;
}

export const JoinNewKoshDialog = ({
  isVisible,
  setIsVisible,
  onConfirm: onConfirmProp,
}: Props) => {
  const { colors } = useAppTheme();
  const code = useNativeState("");
  const router = useRouter();

  const handleValueChange = useCallback(
    (value: string) => {
      "worklet";
      code.value = value;
    },
    [code],
  );

  const onConfirm = useCallback(() => {
    if (!code.value) {
      errorToast({
        title: "Code required",
        description: "Please enter a code to join a Kosh.",
      });
      return;
    }
    onConfirmProp(code.value);
    code.value = "";
    setIsVisible(false);
  }, [code, router]);

  return (
    isVisible && (
      <Host matchContents>
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
                Join a Kosh
              </Text>
              <Spacer modifiers={[height(10)]} />
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "notosans-regular",
                }}
              >
                Enter the Invitation Code below to join a Kosh.
              </Text>
              <Spacer modifiers={[height(24)]} />
              <BasicTextField
                autoFocus
                maxLength={10}
                value={code}
                onValueChange={handleValueChange}
                modifiers={[
                  fillMaxWidth(),
                  clip(Shapes.RoundedCorner(16)),
                  background(colors.background),
                  padding(12, 16, 12, 16),
                ]}
              >
                <BasicTextField.DecorationBox>
                  <Box>
                    <BasicTextField.Placeholder>
                      <Text>e.g. NEWK-XXXXXX</Text>
                    </BasicTextField.Placeholder>
                    <BasicTextField.InnerTextField />
                  </Box>
                </BasicTextField.DecorationBox>
              </BasicTextField>
              <Spacer modifiers={[height(24)]} />
              <Row modifiers={[align("end")]} verticalAlignment="center">
                <TextButton onClick={() => setIsVisible(false)}>
                  <Text>Cancel</Text>
                </TextButton>
                <Button
                  onClick={() => {
                    onConfirm();
                  }}
                >
                  <Text>Confirm</Text>
                </Button>
              </Row>
            </Column>
          </Surface>
        </BasicAlertDialog>
      </Host>
    )
  );
};
