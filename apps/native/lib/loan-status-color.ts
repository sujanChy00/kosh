import type { KoshLoanItem, MyLoanItem } from "@kosh-app/api/routers/loan";

type LoanDisplayStatus = MyLoanItem["status"] | KoshLoanItem["status"];

export function loanStatusColor(
  status: LoanDisplayStatus,
): "success" | "warning" | "danger" | "default" {
  if (status === "active") return "warning";
  if (
    status === "pending_adhyaksh" ||
    status === "pending_koshadhyaksh"
  )
    return "warning";
  if (status === "paid_off") return "success";
  if (status === "defaulted") return "danger";
  return "default";
}