import { View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { GhostButton, PrimaryButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const pad2 = (n: number) => String(n).padStart(2, "0");

export const shiftPeriod = (period: string, delta: number) => {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-01`;
};

export const formatAmount = (v: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(v);

export const formatAmountStr = (s: string | number) =>
  formatAmount(typeof s === "number" ? s : parseFloat(s || "0") || 0);

interface ContributionPeriodNavProps {
  periodData: {
    period: {
      value: string;
      label: string;
      dueDate: string;
      isPastDue: boolean;
    };
    kosh: {
      currency: string;
      monthlyAmount: string;
    };
  };
  isCustomPeriod: boolean;
  expectedTotal: number;
  enteredTotal: number;
  isSaving: boolean;
  onSelectPeriod: (nextPeriod: string) => void;
  onResetDefaultPeriod: () => void;
}

export const ContributionPeriodNav = ({
  periodData,
  isCustomPeriod,
  expectedTotal,
  enteredTotal,
  isSaving,
  onSelectPeriod,
  onResetDefaultPeriod,
}: ContributionPeriodNavProps) => {
  const { period, kosh } = periodData;

  return (
    <Card>
      <Card.Body className="gap-3">
        {/* Navigation */}
        <View className="flex-row items-center justify-between">
          <GhostButton
            className="size-10"
            onPress={() => {
              const next = shiftPeriod(period.value, -1);
              onSelectPeriod(next);
            }}
            disabled={isSaving}
          >
            <ThemedText className="text-lg">‹</ThemedText>
          </GhostButton>

          <View className="flex-1 items-center gap-0.5">
            <ThemedText className="font-medium text-base">
              {period.label}
            </ThemedText>
            <ThemedText className="text-xs text-muted">
              Due {period.dueDate}
              {period.isPastDue ? " · overdue" : ""}
            </ThemedText>
            {!isCustomPeriod && (
              <ThemedText className="text-[10px] text-muted-foreground">
                Current active period
              </ThemedText>
            )}
          </View>

          <GhostButton
            className="size-10"
            onPress={() => {
              const next = shiftPeriod(period.value, 1);
              onSelectPeriod(next);
            }}
            disabled={isSaving}
          >
            <ThemedText className="text-lg">›</ThemedText>
          </GhostButton>
        </View>

        <Separator />

        {/* Summary */}
        <View className="flex-row items-center justify-between">
          <View className="gap-0.5">
            <ThemedText className="text-xs text-muted">Expected</ThemedText>
            <ThemedText className="font-medium">
              {kosh.currency} {formatAmountStr(expectedTotal)}
            </ThemedText>
          </View>
          <View className="items-center gap-0.5">
            <ThemedText className="text-xs text-muted">Entering</ThemedText>
            <ThemedText className="font-semibold text-primary">
              {kosh.currency} {formatAmountStr(enteredTotal)}
            </ThemedText>
          </View>
          <View className="items-end gap-0.5">
            <ThemedText className="text-xs text-muted">Monthly</ThemedText>
            <ThemedText className="text-sm">
              {kosh.currency} {formatAmountStr(kosh.monthlyAmount ?? "0")}
            </ThemedText>
          </View>
        </View>

        {isCustomPeriod && (
          <PrimaryButton
            className="w-full mt-1"
            onPress={onResetDefaultPeriod}
            disabled={isSaving}
          >
            <PrimaryButton.Label>
              Return to active period
            </PrimaryButton.Label>
          </PrimaryButton>
        )}
      </Card.Body>
    </Card>
  );
};
