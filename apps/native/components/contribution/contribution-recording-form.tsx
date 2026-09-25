import { ThemedText } from "@/components/themed-text";
import { PrimaryButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useHaptics } from "@/hooks/use-haptics";
import { errorToast, successToast } from "@/utils/toast";
import { queryClient, trpc } from "@/utils/trpc";
import type {
  ContributionMemberData,
  RecordEntryResult,
} from "@kosh-app/api/routers/contribution";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { ContributionActions } from "./contribution-actions";
import {
  ContributionMemberRow,
  getMemberRowErrors,
  parseAmount,
  type MemberRowState,
} from "./contribution-member-row";
import {
  ContributionPeriodNav,
  formatAmountStr,
} from "./contribution-period-nav";

const rowsFromMembers = (
  members: ContributionMemberData[],
): Record<string, MemberRowState> =>
  Object.fromEntries(
    members.map((m) => {
      const maxContrib =
        parseFloat(m.maxContributionAllowed || m.expectedAmount) || 0;
      const recorded =
        m.existing && parseFloat(m.existing.contributionAmount) > 0
          ? parseFloat(m.existing.contributionAmount)
          : maxContrib;
      const pref = recorded || 0;
      return [
        m.userId,
        {
          contribution: pref > 0 ? String(pref) : "",
          penalty:
            m.maxPenaltyAllowed && parseFloat(m.maxPenaltyAllowed) > 0
              ? m.maxPenaltyAllowed
              : m.penaltyPrefill && parseFloat(m.penaltyPrefill) > 0
                ? m.penaltyPrefill
                : "",
          repayment: "",
        },
      ];
    }),
  );

const deriveStatus = (
  member: ContributionMemberData,
  row: MemberRowState | undefined,
  isPastDue: boolean,
): "paid" | "partial" | "late" | "pending" => {
  const expected = parseFloat(member.expectedAmount) || 0;
  const contributed = parseAmount(row?.contribution ?? "") ?? 0;
  if (contributed >= expected && expected > 0) return "paid";
  if (isPastDue) return "late";
  if (contributed > 0) return "partial";
  return "pending";
};

interface ContributionRecordingFormProps {
  koshId: string;
}

export const ContributionRecordingForm = ({
  koshId,
}: ContributionRecordingFormProps) => {
  const haptics = useHaptics();
  const [period, setPeriod] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, MemberRowState>>({});
  const [saveSummary, setSaveSummary] = useState<{
    successCount: number;
    failedCount: number;
    savedTotal: number;
  } | null>(null);

  const prevPeriodKey = useRef<string | null>(null);

  const periodQuery = useQuery({
    ...trpc.contribution.periodData.queryOptions({
      koshId,
      period: period ?? undefined,
    }),
    enabled: Boolean(koshId),
  });

  const recordBulkMutation = useMutation(
    trpc.contribution.recordBulk.mutationOptions({
      onSuccess: (data) => {
        const failed = data.results.filter((r: RecordEntryResult) => !r.ok);
        const successCount = data.results.length - failed.length;
        const messages = failed
          .map((r: RecordEntryResult) => (r.ok ? "" : r.error))
          .filter(Boolean)
          .join("; ");

        const savedTotal = members.reduce((sum, m) => {
          const val = parseAmount(rows[m.userId]?.contribution ?? "") ?? 0;
          return sum + val;
        }, 0);

        setSaveSummary({
          successCount,
          failedCount: failed.length,
          savedTotal,
        });

        if (failed.length > 0) {
          haptics("warning");
          errorToast({
            title: `${failed.length} member(s) could not be saved`,
            description: messages,
          });
        } else {
          haptics("success");
          successToast({ title: "Contributions saved successfully" });
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
  const currentPeriodKey = data ? `${koshId}::${data.period.value}` : null;

  useEffect(() => {
    if (currentPeriodKey && currentPeriodKey !== prevPeriodKey.current) {
      prevPeriodKey.current = currentPeriodKey;
      if (data) {
        setRows(rowsFromMembers(data.members));
        setSaveSummary(null);
      }
    }
  }, [currentPeriodKey, data]);

  const members = useMemo(() => data?.members ?? [], [data]);
  const isPastDue = data?.period.isPastDue ?? false;

  const expectedTotal = useMemo(
    () =>
      members.reduce(
        (sum, m) =>
          sum + (parseFloat(m.maxContributionAllowed || m.expectedAmount) || 0),
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

  const hasValidationErrors = useMemo(() => {
    if (!data) return false;
    for (const m of data.members) {
      const r = rows[m.userId] ?? {
        contribution: "",
        penalty: "",
        repayment: "",
      };
      const errs = getMemberRowErrors(m, r, data.kosh.currency);
      if (errs.contribution || errs.penalty || errs.repayment) {
        return true;
      }
    }
    return false;
  }, [data, rows]);

  const handleChangeField = useCallback(
    (userId: string, field: keyof MemberRowState, value: string) => {
      setRows((prev) => ({
        ...prev,
        [userId]: {
          ...(prev[userId] ?? {
            contribution: "",
            penalty: "",
            repayment: "",
          }),
          [field]: value,
        },
      }));
    },
    [],
  );

  const handleQuickFillExpected = useCallback(
    (userId: string) => {
      const member = members.find((m) => m.userId === userId);
      if (!member) return;
      const maxContrib = member.maxContributionAllowed || member.expectedAmount;
      setRows((prev) => ({
        ...prev,
        [userId]: {
          ...(prev[userId] ?? {
            contribution: "",
            penalty: "",
            repayment: "",
          }),
          contribution: maxContrib,
        },
      }));
      haptics("tick");
    },
    [members, haptics],
  );

  const markAllPaid = useCallback(() => {
    if (!data) return;
    const next: Record<string, MemberRowState> = {};
    for (const m of data.members) {
      const maxContrib = m.maxContributionAllowed || m.expectedAmount;
      const maxPenalty = m.maxPenaltyAllowed || m.penaltyPrefill || "";
      next[m.userId] = {
        contribution: maxContrib,
        penalty:
          maxPenalty && parseFloat(maxPenalty) > 0
            ? maxPenalty
            : (rows[m.userId]?.penalty ?? ""),
        repayment: rows[m.userId]?.repayment ?? "",
      };
    }
    setRows(next);
    haptics("tick");
  }, [data, rows, haptics]);

  const handleSubmit = useCallback(() => {
    if (!data || !koshId) return;

    // Validate all rows before submitting
    for (const m of data.members) {
      const r = rows[m.userId] ?? {
        contribution: "",
        penalty: "",
        repayment: "",
      };
      const errs = getMemberRowErrors(m, r, data.kosh.currency);
      const firstErr = errs.contribution || errs.penalty || errs.repayment;
      if (firstErr) {
        haptics("error");
        errorToast({
          title: `Invalid entry for ${m.name || "member"}`,
          description: firstErr,
        });
        return;
      }
    }

    const entries = data.members.map((m) => {
      const r = rows[m.userId] ?? {
        contribution: "",
        penalty: "",
        repayment: "",
      };
      return {
        memberId: m.userId,
        contributionAmount: parseAmount(r.contribution),
        penaltyPaid: parseAmount(r.penalty),
        repaymentAmount: parseAmount(r.repayment),
      };
    });
    recordBulkMutation.mutate({
      koshId,
      period: data.period.value,
      entries,
    });
  }, [data, koshId, rows, recordBulkMutation, haptics]);

  const isSaving = recordBulkMutation.isPending;

  if (periodQuery.isError) {
    return (
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
    );
  }

  if (periodQuery.isLoading) {
    return (
      <View className="py-12 items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!data) return null;

  return (
    <View className="gap-4">
      {/* Save Result Summary Card */}
      {saveSummary && (
        <Card className="bg-success/10 border-success/30">
          <Card.Body className="gap-1.5 py-3">
            <ThemedText className="font-semibold text-success text-sm">
              ✓ Saved contributions for {saveSummary.successCount} member(s)
            </ThemedText>
            <ThemedText className="text-xs text-muted">
              Total Recorded: {data.kosh.currency}{" "}
              {formatAmountStr(saveSummary.savedTotal)}
              {saveSummary.failedCount > 0
                ? ` · ${saveSummary.failedCount} failed`
                : ""}
            </ThemedText>
          </Card.Body>
        </Card>
      )}

      {/* Period Navigation */}
      <ContributionPeriodNav
        periodData={data}
        isCustomPeriod={Boolean(period)}
        expectedTotal={expectedTotal}
        enteredTotal={enteredTotal}
        isSaving={isSaving}
        onSelectPeriod={(next) => {
          setPeriod(next);
          setRows({});
          prevPeriodKey.current = null;
        }}
        onResetDefaultPeriod={() => {
          setPeriod(null);
          setRows({});
          prevPeriodKey.current = null;
          periodQuery.refetch();
        }}
      />

      {/* Member Rows */}
      {members.map((member) => {
        const row = rows[member.userId] ?? {
          contribution: "",
          penalty: "",
          repayment: "",
        };
        const status = deriveStatus(member, row, isPastDue);

        return (
          <ContributionMemberRow
            key={member.userId}
            member={member}
            currency={data.kosh.currency}
            row={row}
            status={status}
            isSaving={isSaving}
            onChangeField={handleChangeField}
            onQuickFillExpected={handleQuickFillExpected}
          />
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

      {/* Actions */}
      {members.length > 0 && (
        <ContributionActions
          isSaving={isSaving || hasValidationErrors}
          onMarkAllPaid={markAllPaid}
          onSubmit={handleSubmit}
        />
      )}
    </View>
  );
};
