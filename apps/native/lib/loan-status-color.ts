import type { MyLoanItem } from "@kosh-app/api/routers/loan";

export function loanStatusColor(
  status: MyLoanItem["status"],
): "success" | "warning" | "danger" | "default" {
  if (status === "active") return "warning";
  if (status === "paid_off") return "success";
  if (status === "defaulted") return "danger";
  return "default";
}
