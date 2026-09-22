import type { KoshListItem } from "@kosh-app/api/routers/kosh";
import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, ScrollView, View } from "react-native";
import { ContributionRecordingForm } from "@/components/contribution/contribution-recording-form";
import { ThemedText } from "@/components/themed-text";
import { Card } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { SelectInput } from "@/components/ui/select-input";
import { isIOS } from "@/constants/platform";
import { trpc } from "@/utils/trpc";

const ROLE_LABELS: Record<string, string> = {
  adhyaksh: "Adhyaksh",
  koshadhyaksh: "Koshadhyaksh",
  sadasya: "Sadasya",
};

const ContributionScreen = () => {
  const { koshId: koshIdParam } = useLocalSearchParams<{ koshId?: string }>();

  const [selectedKoshId, setSelectedKoshId] = useState<string | null>(
    koshIdParam ?? null,
  );

  const koshListQuery = useQuery(
    trpc.kosh.list.queryOptions({ limit: 50 }),
  );

  const koshOptions = useMemo(() => {
    const items = koshListQuery.data?.items ?? [];
    return items.map((k: KoshListItem) => ({
      label: `${k.name}  (${ROLE_LABELS[k.role] ?? k.role})`,
      value: k.id,
    }));
  }, [koshListQuery.data?.items]);

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
        <Stack.Title>Contributions</Stack.Title>

        <View className="gap-4 px-4 mt-4">
          {/* Kosh selector card (when not navigating with direct koshId) */}
          {!koshIdParam && (
            <Card>
              <Card.Body className="gap-2">
                <Field>
                  <FieldLabel>Select a kosh</FieldLabel>
                  <SelectInput
                    options={koshOptions}
                    value={selectedKoshId ?? undefined}
                    onValueChange={(v) => {
                      setSelectedKoshId(v);
                    }}
                    placeholder={
                      koshListQuery.isLoading
                        ? "Loading kosh…"
                        : "Choose a kosh"
                    }
                    disabled={koshListQuery.isLoading}
                  />
                </Field>
              </Card.Body>
            </Card>
          )}

          {/* Render recording form once a kosh is selected */}
          {selectedKoshId ? (
            <ContributionRecordingForm koshId={selectedKoshId} />
          ) : (
            <Card>
              <Card.Body className="items-center py-8">
                <ThemedText className="text-muted text-center">
                  Select a kosh above to record contributions.
                </ThemedText>
              </Card.Body>
            </Card>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ContributionScreen;
