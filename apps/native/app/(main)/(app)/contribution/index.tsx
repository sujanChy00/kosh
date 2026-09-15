import type {
  ContributionMemberData,
  RecordEntryResult,
} from "@kosh-app/api/routers/contribution";
import type { KoshListItem } from "@kosh-app/api/routers/kosh";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, ScrollView, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { Avatar } from "@/components/ui/avatar";
import { GhostButton, PrimaryButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { InputGroup } from "@/components/ui/input-group";
import { SelectInput } from "@/components/ui/select-input";
import { Separator } from "@/components/ui/separator";
import { isIOS } from "@/constants/platform";
import { useHaptics } from "@/hooks/use-haptics";
import { errorToast, successToast } from "@/utils/toast";
import { queryClient, trpc } from "@/utils/trpc";

// ─── Helpers ──────────────────────────────────────────────────────────────

const pad2 = (n: number) => String(n).padStart(2, "0");

const parseAmount = (s: string) => {
  const n = parseFloat(s.replace(/,/g, "").trim());
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

const formatAmount = (v: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(v);

const formatAmountStr = (s: string | number) =>
  formatAmount(typeof s === "number" ? s : parseFloat(s || "0") || 0);

const shiftPeriod = (period: string, delta: number) => {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-01`;
};

const ROLE_LABELS: Record<string, string> = {
  adhyaksh: "Adhyaksh",
  koshadhyaksh: "Koshadhyaksh",
  sadasya: "Sadasya",
};

const ROLE_COLOR: Record<string, "primary" | "default" | "success"> = {
  adhyaksh: "primary",
  koshadhyaksh: "success",
  sadasya: "default",
};

const STATUS_CHIP: Record<
  string,
  { color: "success" | "warning" | "danger" | "default"; label: string }
> = {
  paid: { color: "success", label: "Paid" },
  partial: { color: "warning", label: "Partial" },
  late: { color: "danger", label: "Late" },
  pending: { color: "default", label: "Pending" },
};

// ─── Per-member editable state ────────────────────────────────────────────

type MemberRow = {
  contribution: string;
  penalty: string;
  repayment: string;
};

const rowsFromMembers = (
  members: ContributionMemberData[],
): Record<string, MemberRow> =>
  Object.fromEntries(
    members.map((m) => {
      // Existing partials must not be wiped by the expected-amount prefill:
      // prefill what is already recorded and let the adhyaksh top it up.
      const recorded =
        m.existing && parseFloat(m.existing.contributionAmount) > 0
          ? parseFloat(m.existing.contributionAmount)
          : parseFloat(m.contributionPrefill || "0");
      const pref = recorded || 0;
      return [
        m.userId,
        {
          contribution: pref > 0 ? String(pref) : "",
          penalty:
            m.penaltyPrefill && parseFloat(m.penaltyPrefill) > 0
              ? m.penaltyPrefill
              : "",
          repayment: "",
        },
      ];
    }),
  );

const deriveStatus = (
  member: ContributionMemberData,
  row: MemberRow | undefined,
  isPastDue: boolean,
) => {
  const expected = parseFloat(member.expectedAmount) || 0;
  const contributed = parseAmount(row?.contribution ?? "") ?? 0;
  if (contributed >= expected) return "paid";
  if (isPastDue) return "late";
  if (contributed > 0) return "partial";
  return "pending";
};

// ─── Screen ───────────────────────────────────────────────────────────────

const ContributionScreen = () => {
  const { koshId: koshIdParam } = useLocalSearchParams<{ koshId?: string }>();
  const haptics = useHaptics();

  const [selectedKoshId, setSelectedKoshId] = useState<string | null>(
    koshIdParam ?? null,
  );

  const [period, setPeriod] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, MemberRow>>({});

  const prevPeriodKey = useRef<string | null>(null);

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

  const periodQuery = useQuery({
    ...trpc.contribution.periodData.queryOptions({
      koshId: selectedKoshId ?? "",
      period: period ?? undefined,
    }),
    enabled: Boolean(selectedKoshId),
  });

  const recordBulkMutation = useMutation(
    trpc.contribution.recordBulk.mutationOptions({
      onSuccess: (data) => {
        const failed = data.results.filter(
          (r: RecordEntryResult) => !r.ok,
        );
        const messages = (
          failed.length > 0
            ? failed
                .map((r: RecordEntryResult) => (r.ok ? "" : r.error))
                .filter(Boolean)
            : []
        ).join("; ");
        if (failed.length > 0) {
          haptics("warning");
          errorToast({
            title: `${failed.length} member(s) could not be saved`,
            description: messages,
          });
        } else {
          haptics("success");
          successToast({ title: "Contributions saved" });
        }
        queryClient.invalidateQueries({
          queryKey: trpc.kosh.list.queryKey(),
        });
        periodQuery.refetch();
      },
      onError: (error) => {
        haptics("error");
        errorToast({
          title: error.message || "Failed to save contributions",
        });
      },
    }),
  );

  const data = periodQuery.data;

  // Reset rows whenever the kosh/period key changes
  const currentPeriodKey = data
    ? `${selectedKoshId}::${data.period.value}`
    : null;

  useEffect(() => {
    if (currentPeriodKey && currentPeriodKey !== prevPeriodKey.current) {
      prevPeriodKey.current = currentPeriodKey;
      if (data) setRows(rowsFromMembers(data.members));
    }
  }, [currentPeriodKey, data]);

  // Derived values for the header summary
  const members = data?.members ?? [];
  const kosh = data?.kosh;
  const isPastDue = data?.period.isPastDue ?? false;

  const expectedTotal = useMemo(
    () =>
      members.reduce(
        (sum, m) => sum + (parseFloat(m.expectedAmount) || 0),
        0,
      ),
    [members],
  );

  const enteredTotal = useMemo(
    () =>
      members.reduce((sum, m) => {
        const val = parseAmount(rows[m.userId]?.contribution ?? "") ?? 0;
        return sum + val;
      }, 0),
    [members, rows],
  );

  const markAllPaid = useCallback(() => {
    if (!data) return;
    const next: Record<string, MemberRow> = {};
    for (const m of data.members) {
      next[m.userId] = {
        contribution: m.expectedAmount,
        penalty:
          m.penaltyPrefill && parseFloat(m.penaltyPrefill) > 0
            ? m.penaltyPrefill
            : rows[m.userId]?.penalty ?? "",
        repayment: rows[m.userId]?.repayment ?? "",
      };
    }
    setRows(next);
    haptics("tick");
  }, [data, rows, haptics]);

  const handleSubmit = useCallback(() => {
    if (!data || !selectedKoshId) return;
    const entries = data.members.map((m) => {
      const r = rows[m.userId] ?? { contribution: "", penalty: "", repayment: "" };
      return {
        memberId: m.userId,
        contributionAmount: parseAmount(r.contribution),
        penaltyPaid: parseAmount(r.penalty),
        repaymentAmount: parseAmount(r.repayment),
      };
    });
    recordBulkMutation.mutate({
      koshId: selectedKoshId,
      period: data.period.value,
      entries,
    });
  }, [data, selectedKoshId, rows, recordBulkMutation]);

  const isSaving = recordBulkMutation.isPending;
  const isLoadingPeriod = periodQuery.isLoading;

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
          {/* ── Kosh picker (only when no koshId param) ──────────────── */}
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
                      setPeriod(null);
                      setRows({});
                      prevPeriodKey.current = null;
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

          {/* ── Error from periodData (FORBIDDEN / network) ─────────── */}
          {selectedKoshId && periodQuery.isError && (
            <Card>
              <Card.Body className="items-center gap-4 py-6">
                <ThemedText className="text-center text-danger">
                  {periodQuery.error?.message ?? "Failed to load period data"}
                </ThemedText>
                <PrimaryButton onPress={() => periodQuery.refetch()}>
                  <PrimaryButton.Label>Try again</PrimaryButton.Label>
                </PrimaryButton>
              </Card.Body>
            </Card>
          )}

          {/* ── Loading ──────────────────────────────────────────────── */}
          {selectedKoshId && isLoadingPeriod && (
            <View className="py-12 items-center">
              <ActivityIndicator />
            </View>
          )}

          {/* ── Period data ──────────────────────────────────────────── */}
          {data && (
            <>
              {/* ── Period navigation + summary card ────────────────── */}
              <Card>
                <Card.Body className="gap-3">
                  {/* Navigation */}
                  <View className="flex-row items-center justify-between">
                    <GhostButton
                      className="size-10"
                      onPress={() => {
                        const next = shiftPeriod(
                          data.period.value,
                          -1,
                        );
                        setPeriod(next);
                        setRows({});
                        prevPeriodKey.current = null;
                      }}
                      disabled={isSaving}
                    >
                      <ThemedText className="text-lg">‹</ThemedText>
                    </GhostButton>

                    <View className="flex-1 items-center gap-0.5">
                      <ThemedText className="font-medium text-base">
                        {data.period.label}
                      </ThemedText>
                      <ThemedText className="text-xs text-muted">
                        Due {data.period.dueDate}
                        {data.period.isPastDue ? " · overdue" : ""}
                      </ThemedText>
                      {!period && (
                        <ThemedText className="text-[10px] text-muted-foreground">
                          Default period
                        </ThemedText>
                      )}
                    </View>

                    <GhostButton
                      className="size-10"
                      onPress={() => {
                        const next = shiftPeriod(
                          data.period.value,
                          1,
                        );
                        setPeriod(next);
                        setRows({});
                        prevPeriodKey.current = null;
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
                      <ThemedText className="text-xs text-muted">
                        Expected
                      </ThemedText>
                      <ThemedText className="font-medium">
                        {kosh?.currency} {formatAmountStr(expectedTotal)}
                      </ThemedText>
                    </View>
                    <View className="items-center gap-0.5">
                      <ThemedText className="text-xs text-muted">
                        Entering
                      </ThemedText>
                      <ThemedText className="font-medium">
                        {kosh?.currency} {formatAmountStr(enteredTotal)}
                      </ThemedText>
                    </View>
                    <View className="items-end gap-0.5">
                      <ThemedText className="text-xs text-muted">
                        Monthly
                      </ThemedText>
                      <ThemedText className="text-sm">
                        {kosh?.currency}{" "}
                        {formatAmountStr(kosh?.monthlyAmount ?? "0")}
                      </ThemedText>
                    </View>
                  </View>

                  {!period && (
                    <PrimaryButton
                      className="w-full"
                      onPress={() => {
                        // Reset to the actual default by clearing the period param
                        setPeriod(null);
                        setRows({});
                        prevPeriodKey.current = null;
                        periodQuery.refetch();
                      }}
                      disabled={isSaving}
                    >
                      <PrimaryButton.Label>
                        Reload default period
                      </PrimaryButton.Label>
                    </PrimaryButton>
                  )}
                </Card.Body>
              </Card>

              {/* ── Member rows ────────────────────────────────────── */}
              {members.map((member) => {
                const row = rows[member.userId] ?? {
                  contribution: "",
                  penalty: "",
                  repayment: "",
                };
                const status = deriveStatus(member, row, isPastDue);
                const chip = STATUS_CHIP[status] ?? STATUS_CHIP.pending;
                const showPenalty =
                  member.penaltyPrefill != null &&
                  parseFloat(member.penaltyPrefill) > 0;
                const hasLoan = member.hasActiveLoan;

                return (
                  <Card key={member.userId} className="gap-0">
                    <Card.Body className="gap-3">
                      {/* Header: avatar + name + role + status */}
                      <View className="flex-row items-center gap-3">
                        <Avatar>
                          <Avatar.Image
                            source={
                              member.image ? { uri: member.image } : undefined
                            }
                          />
                          <Avatar.Fallback
                            source={member.image}
                            fallback={member.name ?? ""}
                          />
                        </Avatar>

                        <View className="flex-1 gap-0.5">
                          <View className="flex-row items-center gap-2 flex-wrap">
                            <ThemedText
                              className="font-medium"
                              numberOfLines={1}
                            >
                              {member.name ?? "Unknown"}
                            </ThemedText>
                            <Chip
                              variant="soft"
                              color={ROLE_COLOR[member.role] ?? "default"}
                              size="sm"
                            >
                              <Chip.Label>
                                {ROLE_LABELS[member.role] ?? member.role}
                              </Chip.Label>
                            </Chip>
                          </View>
                          <ThemedText className="text-xs text-muted">
                            Expected{" "}
                            {kosh?.currency}{" "}
                            {formatAmountStr(member.expectedAmount)}
                            {member.existing
                              ? `  ·  ${member.existing.status}`
                              : ""}
                          </ThemedText>
                        </View>

                        <View className="items-end gap-1">
                          <Chip
                            variant="primary"
                            color={chip.color}
                            size="sm"
                          >
                            <Chip.Label>{chip.label}</Chip.Label>
                          </Chip>
                          {member.recordedLate && (
                            <Chip
                              variant="soft"
                              color="danger"
                              size="sm"
                            >
                              <Chip.Label>Late</Chip.Label>
                            </Chip>
                          )}
                        </View>
                      </View>

                      {/* Carried-over arrears from previous periods (read-only) */}
                      {(parseFloat(member.arrears.penalty) > 0 ||
                        parseFloat(member.arrears.contribution) > 0) && (
                        <View className="rounded-lg bg-danger/10 p-2.5">
                          <ThemedText className="text-xs font-medium text-danger">
                            Also owes from previous periods
                          </ThemedText>
                          <ThemedText className="text-xs text-muted">
                            {parseFloat(member.arrears.contribution) > 0
                              ? `Contribution ${kosh?.currency} ${formatAmountStr(member.arrears.contribution)}`
                              : "Contribution fully paid"}
                            {"  ·  "}
                            {parseFloat(member.arrears.penalty) > 0
                              ? `Penalty ${kosh?.currency} ${formatAmountStr(member.arrears.penalty)}`
                              : "Penalty cleared"}
                          </ThemedText>
                        </View>
                      )}

                      {/* Contribution input */}
                      <Field>
                        <FieldLabel>Contribution ({kosh?.currency})</FieldLabel>
                        <InputGroup>
                          <InputGroup.Prefix>
                            <ThemedText className="text-sm text-muted">
                              Rs.
                            </ThemedText>
                          </InputGroup.Prefix>
                          <InputGroup.Input
                            keyboardType="decimal-pad"
                            placeholder={member.contributionPrefill}
                            value={row.contribution}
                            onChangeText={(text) =>
                              setRows((prev) => ({
                                ...prev,
                                [member.userId]: {
                                  ...prev[member.userId],
                                  contribution: text,
                                },
                              }))
                            }
                            editable={!isSaving}
                          />
                        </InputGroup>
                      </Field>

                      {/* Penalty input (when penalty applies) */}
                      {showPenalty && (
                        <Field>
                          <FieldLabel>
                            Late penalty ({kosh?.currency})
                          </FieldLabel>
                          <FieldDescription>
                            Assessed {kosh?.currency}{" "}
                            {formatAmountStr(member.penaltyPrefill ?? "0")}
                          </FieldDescription>
                          <InputGroup>
                            <InputGroup.Prefix>
                              <ThemedText className="text-sm text-muted">
                                Rs.
                              </ThemedText>
                            </InputGroup.Prefix>
                            <InputGroup.Input
                              keyboardType="decimal-pad"
                              placeholder={member.penaltyPrefill ?? "0"}
                              value={row.penalty}
                              onChangeText={(text) =>
                                setRows((prev) => ({
                                  ...prev,
                                  [member.userId]: {
                                    ...prev[member.userId],
                                    penalty: text,
                                  },
                                }))
                              }
                              editable={!isSaving}
                            />
                          </InputGroup>
                        </Field>
                      )}

                      {/* Loan repayment input (when active loan) */}
                      {hasLoan && (
                        <Field>
                          <FieldLabel>
                            Loan repayment ({kosh?.currency})
                          </FieldLabel>
                          <FieldDescription>
                            Remaining {kosh?.currency}{" "}
                            {formatAmountStr(member.loanRemaining ?? "0")} ·
                            interest-first split
                          </FieldDescription>
                          <InputGroup>
                            <InputGroup.Prefix>
                              <ThemedText className="text-sm text-muted">
                                Rs.
                              </ThemedText>
                            </InputGroup.Prefix>
                            <InputGroup.Input
                              keyboardType="decimal-pad"
                              placeholder="0"
                              value={row.repayment}
                              onChangeText={(text) =>
                                setRows((prev) => ({
                                  ...prev,
                                  [member.userId]: {
                                    ...prev[member.userId],
                                    repayment: text,
                                  },
                                }))
                              }
                              editable={!isSaving}
                            />
                          </InputGroup>
                        </Field>
                      )}
                    </Card.Body>
                  </Card>
                );
              })}

              {members.length === 0 && (
                <Card>
                  <Card.Body className="items-center py-6 gap-3">
                    <ThemedText className="text-muted text-center">
                      No active members in this kosh.
                    </ThemedText>
                  </Card.Body>
                </Card>
              )}

              {/* ── Actions ──────────────────────────────────────────── */}
              {members.length > 0 && (
                <View className="gap-3">
                  <PrimaryButton
                    className="w-full"
                    onPress={markAllPaid}
                    disabled={isSaving}
                  >
                    <PrimaryButton.Label>Mark all as paid</PrimaryButton.Label>
                  </PrimaryButton>

                  <PrimaryButton
                    className="w-full"
                    onPress={handleSubmit}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator
                        color="white"
                        size="small"
                      />
                    ) : (
                      <PrimaryButton.Label>Save contributions</PrimaryButton.Label>
                    )}
                  </PrimaryButton>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ContributionScreen;
