import type { KoshListItem } from "@kosh-app/api/routers/kosh";
import { StyledSymbolView } from "../styled-symbol-view";
import { Chip } from "../ui/chip";

export const KoshRoleChip = ({ role }: { role: KoshListItem["role"] }) => {
  return (
    <Chip
      size="sm"
      variant="soft"
      color={role === "adhyaksh" ? "warning" : "success"}
    >
      {role === "adhyaksh" && (
        <StyledSymbolView
          size={14}
          tintColorClassName="accent-warning"
          name={{
            android: "crown",
          }}
        />
      )}
      <Chip.Label className="font-mono-regular capitalize">{role}</Chip.Label>
    </Chip>
  );
};
