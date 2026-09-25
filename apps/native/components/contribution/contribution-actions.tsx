import { ActivityIndicator, View } from "react-native";
import { GhostButton, PrimaryButton } from "@/components/ui/button";

interface ContributionActionsProps {
  isSaving: boolean;
  onMarkAllPaid: () => void;
  onSubmit: () => void;
}

export const ContributionActions = ({
  isSaving,
  onMarkAllPaid,
  onSubmit,
}: ContributionActionsProps) => {
  return (
    <View className="gap-3 mt-2">
      <GhostButton
        className="w-full border border-border"
        onPress={onMarkAllPaid}
        disabled={isSaving}
      >
        <GhostButton.Label>Mark all as paid</GhostButton.Label>
      </GhostButton>

      <PrimaryButton className="w-full" onPress={onSubmit} disabled={isSaving}>
        {isSaving ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <PrimaryButton.Label>Save contributions</PrimaryButton.Label>
        )}
      </PrimaryButton>
    </View>
  );
};
