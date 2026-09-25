import { Stack, useLocalSearchParams } from "expo-router";
import { KeyboardAvoidingView, ScrollView, View } from "react-native";
import { ContributionRecordingForm } from "@/components/contribution/contribution-recording-form";
import { ThemedText } from "@/components/themed-text";
import { Card } from "@/components/ui/card";
import { isIOS } from "@/constants/platform";

const KoshContributeScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <KeyboardAvoidingView
      behavior={isIOS ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerClassName="pt-6 pb-6"
      >
        <Stack.Title>Record Contribution</Stack.Title>

        <View className="gap-4 px-4 mt-4">
          {id ? (
            <ContributionRecordingForm koshId={id} />
          ) : (
            <Card>
              <Card.Body className="items-center py-8">
                <ThemedText className="text-danger text-center">
                  Invalid Kosh ID
                </ThemedText>
              </Card.Body>
            </Card>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default KoshContributeScreen;
