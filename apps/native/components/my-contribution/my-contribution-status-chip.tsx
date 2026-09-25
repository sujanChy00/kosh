import type { MyContributionItem } from "@kosh-app/api/routers/contribution";
import { useMemo } from "react";
import { Chip } from "../ui/chip";

export const MyContributionStatusChip = ({
  status,
}: {
  status: MyContributionItem["status"];
}) => {
  const statusColor = useMemo(() => {
    switch (status) {
      case "paid":
        return "success";
      case "late":
        return "danger";
      case "partial":
      case "pending":
        return "warning";
      default:
        return "default";
    }
  }, [status]);

  return (
    <Chip variant="soft" color={statusColor} size="sm">
      <Chip.Label className="uppercase font-mono-semibold">{status}</Chip.Label>
    </Chip>
  );
};
