import type { ContributionMemberData } from "@kosh-app/api/routers/contribution";
import { Pressable, View } from "react-native";
import { formatAmountStr } from "./contribution-period-nav";
import { ThemedText } from "@/components/themed-text";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { InputGroup } from "@/components/ui/input-group";

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

export type MemberRowState = {
  contribution: string;
  penalty: string;
  repayment: string;
};

export const parseAmount = (s: string) => {
  const trimmed = (s ?? "").replace(/,/g, "").trim();
  if (!trimmed) return undefined;
  const n = parseFloat(trimmed);
  return Number.isFinite(n) ? n : undefined;
};

export const getMemberRowErrors = (
  member: ContributionMemberData,
  row: MemberRowState,
  currency: string,
) => {
  const errors: {
    contribution?: string;
    penalty?: string;
    repayment?: string;
  } = {};

  const maxContribAllowedNum =
    parseFloat(member.maxContributionAllowed || member.expectedAmount) || 0;
  const contribNum = parseAmount(row.contribution);
  if (contribNum !== undefined) {
    if (contribNum < 0) {
      errors.contribution = "Contribution amount cannot be negative";
    } else if (contribNum > maxContribAllowedNum) {
      errors.contribution = `Cannot exceed total contribution due (${currency} ${formatAmountStr(maxContribAllowedNum)})`;
    }
  }

  const maxPenaltyNum =
    parseFloat(member.maxPenaltyAllowed || member.penaltyPrefill || "0") || 0;
  const penaltyNum = parseAmount(row.penalty);
  if (penaltyNum !== undefined) {
    if (penaltyNum < 0) {
      errors.penalty = "Penalty amount cannot be negative";
    } else if (penaltyNum > maxPenaltyNum) {
      errors.penalty = `Cannot exceed total penalty due (${currency} ${formatAmountStr(maxPenaltyNum)})`;
    }
  }

  const maxLoanPayoffNum = member.activeLoan
    ? parseFloat(member.activeLoan.totalPayoff || "0")
    : parseFloat(member.loanRemaining || "0");
  const repaymentNum = parseAmount(row.repayment);
  if (repaymentNum !== undefined && member.hasActiveLoan) {
    if (repaymentNum < 0) {
      errors.repayment = "Loan repayment amount cannot be negative";
    } else if (repaymentNum > maxLoanPayoffNum) {
      errors.repayment = `Cannot exceed total loan payoff (${currency} ${formatAmountStr(maxLoanPayoffNum)})`;
    }
  }

  return errors;
};

interface ContributionMemberRowProps {
  member: ContributionMemberData;
  currency: string;
  row: MemberRowState;
  status: "paid" | "partial" | "late" | "pending";
  isSaving: boolean;
  onChangeField: (
    userId: string,
    field: keyof MemberRowState,
    value: string,
  ) => void;
  onQuickFillExpected: (userId: string) => void;
}

export const ContributionMemberRow = ({
  member,
  currency,
  row,
  status,
  isSaving,
  onChangeField,
  onQuickFillExpected,
}: ContributionMemberRowProps) => {
  const chip = STATUS_CHIP[status] ?? STATUS_CHIP.pending;
  const showPenalty =
    member.penaltyPrefill != null && parseFloat(member.penaltyPrefill) > 0;
  const hasLoan = member.hasActiveLoan;
  const hasArrears =
    parseFloat(member.arrears.penalty) > 0 ||
    parseFloat(member.arrears.contribution) > 0;

  const maxContributionNum =
    parseFloat(member.maxContributionAllowed || member.expectedAmount) || 0;

  const isFilled =
    parseFloat(row.contribution || "0") >= maxContributionNum &&
    maxContributionNum > 0;

  const errors = getMemberRowErrors(member, row, currency);

  return (
    <Card className="gap-0">
      <Card.Body className="gap-3">
        {/* Header: avatar + name + role + status */}
        <View className="flex-row items-center gap-3">
          <Avatar>
            <Avatar.Image
              source={member.image ? { uri: member.image } : undefined}
            />
            <Avatar.Fallback
              source={member.image}
              fallback={member.name ?? ""}
            />
          </Avatar>

          <View className="flex-1 gap-0.5">
            <View className="flex-row items-center gap-2 flex-wrap">
              <ThemedText className="font-medium" numberOfLines={1}>
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
              Monthly Expected: {currency} {formatAmountStr(member.expectedAmount)}
              {member.existing ? `  ·  ${member.existing.status}` : ""}
            </ThemedText>
          </View>

          <View className="items-end gap-1">
            <Chip variant="primary" color={chip.color} size="sm">
              <Chip.Label>{chip.label}</Chip.Label>
            </Chip>
            {member.recordedLate && (
              <Chip variant="soft" color="danger" size="sm">
                <Chip.Label>Late</Chip.Label>
              </Chip>
            )}
          </View>
        </View>

        {/* Carried-over arrears from previous periods */}
        {hasArrears && (
          <View className="rounded-lg bg-danger/10 p-2.5">
            <ThemedText className="text-xs font-medium text-danger">
              Owes arrears from previous periods
            </ThemedText>
            <ThemedText className="text-xs text-muted mt-0.5">
              {parseFloat(member.arrears.contribution) > 0
                ? `Contribution Arrears: ${currency} ${formatAmountStr(member.arrears.contribution)}`
                : "Contribution fully paid"}
              {"  ·  "}
              {parseFloat(member.arrears.penalty) > 0
                ? `Penalty Arrears: ${currency} ${formatAmountStr(member.arrears.penalty)}`
                : "Penalty cleared"}
            </ThemedText>
          </View>
        )}

        {/* Active Loan Details Breakdown */}
        {hasLoan && member.activeLoan && (
          <View className="rounded-lg bg-primary/10 p-2.5 gap-1 border border-primary/20">
            <ThemedText className="text-xs font-semibold text-primary">
              Active Loan Breakdown
            </ThemedText>
            <View className="flex-row items-center justify-between">
              <ThemedText className="text-xs text-muted">
                Principal Remaining:
              </ThemedText>
              <ThemedText className="text-xs font-medium">
                {currency} {formatAmountStr(member.activeLoan.remainingPrincipal)}
              </ThemedText>
            </View>
            <View className="flex-row items-center justify-between">
              <ThemedText className="text-xs text-muted">
                Accrued Interest Due:
              </ThemedText>
              <ThemedText className="text-xs font-medium text-amber-600">
                {currency} {formatAmountStr(member.activeLoan.interestOwed)}
              </ThemedText>
            </View>
            <View className="flex-row items-center justify-between pt-1 border-t border-primary/20 mt-0.5">
              <ThemedText className="text-xs font-semibold">
                Total Loan Payoff Cap:
              </ThemedText>
              <ThemedText className="text-xs font-bold text-primary">
                {currency} {formatAmountStr(member.activeLoan.totalPayoff)}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Contribution input + Quick Fill action */}
        <Field>
          <View className="flex-row items-center justify-between">
            <FieldLabel>Contribution ({currency})</FieldLabel>
            {!isFilled && (
              <Pressable
                onPress={() => onQuickFillExpected(member.userId)}
                disabled={isSaving}
                className="active:opacity-70"
              >
                <ThemedText className="text-xs text-primary font-medium">
                  Fill {formatAmountStr(maxContributionNum)}
                </ThemedText>
              </Pressable>
            )}
          </View>
          <InputGroup
            className={
              errors.contribution
                ? "border border-danger"
                : "border border-separator"
            }
          >
            <InputGroup.Prefix>
              <ThemedText className="text-sm text-muted">Rs.</ThemedText>
            </InputGroup.Prefix>
            <InputGroup.Input
              keyboardType="decimal-pad"
              placeholder={String(maxContributionNum)}
              value={row.contribution}
              onChangeText={(text) =>
                onChangeField(member.userId, "contribution", text)
              }
              editable={!isSaving}
            />
          </InputGroup>
          {errors.contribution ? (
            <ThemedText className="text-xs text-danger font-medium mt-1">
              {errors.contribution}
            </ThemedText>
          ) : (
            parseFloat(member.arrears.contribution) > 0 && (
              <FieldDescription className="text-xs text-muted mt-0.5">
                Includes {currency} {formatAmountStr(member.arrears.contribution)} arrears
              </FieldDescription>
            )
          )}
        </Field>

        {/* Penalty input */}
        {showPenalty && (
          <Field>
            <FieldLabel>Late penalty ({currency})</FieldLabel>
            <FieldDescription>
              Assessed {currency}{" "}
              {formatAmountStr(member.maxPenaltyAllowed || member.penaltyPrefill || "0")}
            </FieldDescription>
            <InputGroup
              className={
                errors.penalty
                  ? "border border-danger"
                  : "border border-separator"
              }
            >
              <InputGroup.Prefix>
                <ThemedText className="text-sm text-muted">Rs.</ThemedText>
              </InputGroup.Prefix>
              <InputGroup.Input
                keyboardType="decimal-pad"
                placeholder={member.maxPenaltyAllowed || member.penaltyPrefill || "0"}
                value={row.penalty}
                onChangeText={(text) =>
                  onChangeField(member.userId, "penalty", text)
                }
                editable={!isSaving}
              />
            </InputGroup>
            {errors.penalty && (
              <ThemedText className="text-xs text-danger font-medium mt-1">
                {errors.penalty}
              </ThemedText>
            )}
          </Field>
        )}

        {/* Loan repayment input */}
        {hasLoan && (
          <Field>
            <FieldLabel>Loan repayment ({currency})</FieldLabel>
            <FieldDescription>
              Interest-first split (Interest: {currency}{" "}
              {formatAmountStr(member.activeLoan?.interestOwed ?? "0")})
            </FieldDescription>
            <InputGroup
              className={
                errors.repayment
                  ? "border border-danger"
                  : "border border-separator"
              }
            >
              <InputGroup.Prefix>
                <ThemedText className="text-sm text-muted">Rs.</ThemedText>
              </InputGroup.Prefix>
              <InputGroup.Input
                keyboardType="decimal-pad"
                placeholder="0"
                value={row.repayment}
                onChangeText={(text) =>
                  onChangeField(member.userId, "repayment", text)
                }
                editable={!isSaving}
              />
            </InputGroup>
            {errors.repayment && (
              <ThemedText className="text-xs text-danger font-medium mt-1">
                {errors.repayment}
              </ThemedText>
            )}
          </Field>
        )}
      </Card.Body>
    </Card>
  );
};
