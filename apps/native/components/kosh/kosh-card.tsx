import type { KoshListItem } from "@kosh-app/api/routers/kosh";
import { formatAmount } from "@kosh-app/utils";
import { Link } from "expo-router";
import { memo } from "react";
import { TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";
import { Avatar } from "../ui/avatar";
import { Card } from "../ui/card";
import { Chip } from "../ui/chip";
import { Separator } from "../ui/separator";

export const KoshCard = memo(({ kosh }: { kosh: KoshListItem }) => {
  return (
    <Link
      asChild
      href={{
        pathname: "/kosh/[id]",
        params: {
          id: String(kosh.id),
        },
      }}
    >
      <TouchableOpacity>
        <Card className={"w-full gap-y-4"}>
          <View>
            <Card.Header className={"flex-row items-center gap-2 pb-4"}>
              <Avatar className="size-12 rounded-2xl">
                <Avatar.Image source={kosh.iconUrl} alt={kosh.name} />
                <Avatar.Fallback fallback={kosh.name} source={kosh.iconUrl} />
              </Avatar>
              <View>
                <Card.Title className="capitalize">{kosh.name}</Card.Title>
                <View className="flex-row items-center gap-2">
                  <Chip variant="soft">
                    <Chip.Label className="uppercase text-xs font-mono-medium">
                      {kosh.role}
                    </Chip.Label>
                  </Chip>
                  <Card.Description className="text-xs font-mono-medium">
                    {kosh.memberCount} members
                  </Card.Description>
                </View>
              </View>
            </Card.Header>
            {!!kosh.description && (
              <ThemedText className="text-xs text-muted-foreground">
                {kosh.description}
              </ThemedText>
            )}
          </View>
          <Separator />
          <Card.Body className={"gap-y-3"}>
            <View className="flex-row items-center justify-between gap-3">
              <ThemedText className="text-muted-foreground">In Kosh</ThemedText>
              <ThemedText className="text-xl font-mono-semibold">
                NPR {formatAmount(kosh.totalRemaining)}
              </ThemedText>
            </View>
            <View className="flex-row items-center justify-between gap-3">
              <ThemedText className="text-muted-foreground">
                Collected
              </ThemedText>
              <ThemedText className="text-base font-mono-regular text-muted-foreground">
                NPR {formatAmount(kosh.totalCollected)}
              </ThemedText>
            </View>
          </Card.Body>
          <Separator />
          <Card.Footer className="flex-row items-center gap-3 justify-between">
            <ThemedText className="text-muted-foreground text-xs">
              Monthly Contribution
            </ThemedText>
            <ThemedText className="font-mono-medium">
              NPR {formatAmount(kosh.monthlyAmount)}
            </ThemedText>
          </Card.Footer>
        </Card>
      </TouchableOpacity>
    </Link>
  );
});
