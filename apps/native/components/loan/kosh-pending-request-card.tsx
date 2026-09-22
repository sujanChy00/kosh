import { ThemedText } from "@/components/themed-text";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Separator } from "@/components/ui/separator";
import type { KoshPendingLoanRequestItem } from "@kosh-app/api/routers/loan";
import { formatAmount } from "@kosh-app/utils";
import { formatShortDate } from "@kosh-app/utils/date";
import { View } from "react-native";

export const KoshPendingRequestCard = ({
  item,
}: {
  item: KoshPendingLoanRequestItem;
}) => {
  return (
    <Card className="p-4 gap-y-3">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 flex-1 shrink">
          <Avatar className="size-9 rounded-2xl">
            <Avatar.Image
              source={item.borrowerAvatar}
              alt={item.borrowerName}
            />
            <Avatar.Fallback
              source={item.borrowerAvatar}
              fallback={item.borrowerName}
            />
          </Avatar>
          <View className="flex-1 shrink">
            <ThemedText
              numberOfLines={1}
              className="font-notosans-semibold text-base"
            >
              {item.borrowerName}
            </ThemedText>
            <ThemedText className="text-xs text-muted-foreground font-mono-regular">
              Requested {formatShortDate(new Date(item.createdAt))}
            </ThemedText>
          </View>
        </View>

        <Chip variant="soft" color="warning" size="sm">
          <Chip.Label className="uppercase font-mono-semibold">
            Pending
          </Chip.Label>
        </Chip>
      </View>

      <Separator />

      {/* Details */}
      <View className="gap-y-2">
        <View className="flex-row justify-between items-center">
          <ThemedText className="text-xs text-muted-foreground font-mono-regular">
            Requested Amount
          </ThemedText>
          <ThemedText className="font-mono-semibold text-base text-warning">
            रु {formatAmount(item.amountRequested)}
          </ThemedText>
        </View>

        {item.note && (
          <View className="gap-y-1 mt-1 bg-surface-secondary p-2.5 rounded-lg">
            <ThemedText className="text-xs font-mono-semibold text-muted-foreground">
              Note
            </ThemedText>
            <ThemedText className="text-xs font-notosans-regular">
              {item.note}
            </ThemedText>
          </View>
        )}
      </View>
    </Card>
  );
};
