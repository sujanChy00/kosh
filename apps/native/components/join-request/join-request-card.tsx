import type { JoinRequest } from "@kosh-app/api/routers/invite";
import { KoshListItem } from "@kosh-app/api/routers/kosh";
import { formatShortDate } from "@kosh-app/utils/date";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { View } from "react-native";
import { ThemedText } from "../themed-text";
import { Avatar } from "../ui/avatar";
import { Card } from "../ui/card";
import { Chip } from "../ui/chip";
import { Separator } from "../ui/separator";
import { ApproveJoinRequestDialog } from "./approve-request-dialog";
import { RejectJoinRequestDialog } from "./reject-request-dialog";

export const JoinRequestCard = ({ request }: { request: JoinRequest }) => {
  const { role } = useLocalSearchParams<{
    role: KoshListItem["role"];
  }>();
  const showActions = useMemo(
    () =>
      (role === "adhyaksh" || role === "koshadhyaksh") &&
      request.status === "pending",
    [role, request.status],
  );
  return (
    <Card>
      <Card.Body className="flex-row items-center gap-3">
        <Avatar>
          <Avatar.Image source={request.user?.image} alt={request.user?.name} />
          <Avatar.Fallback
            source={request.user?.image}
            fallback={request.user?.name ?? "Unknown"}
          />
        </Avatar>
        <Card.Header className="flex-1 shrink">
          <Card.Title numberOfLines={1}>
            {request.user?.name ?? "Unknown user"}
          </Card.Title>
          <Card.Description className="text-sm">
            {request.user?.email}
          </Card.Description>
        </Card.Header>
        <View className="items-end gap-1 shrink-0">
          <Chip
            size="sm"
            variant="soft"
            color={request.status === "pending" ? "warning" : "success"}
            className="shrink-0"
          >
            <Chip.Label className="shrink-0">
              {request.status.toUpperCase()}
            </Chip.Label>
          </Chip>
          <ThemedText className="text-xs text-muted">
            {formatShortDate(new Date(request.requestedAt))}
          </ThemedText>
        </View>
      </Card.Body>
      {showActions && (
        <>
          <Separator className="my-3" />
          <Card.Footer className={"flex-row items-center gap-1"}>
            <RejectJoinRequestDialog
              koshId={request.koshId}
              requestId={request.id}
            />
            <ApproveJoinRequestDialog
              koshId={request.koshId}
              requestId={request.id}
            />
          </Card.Footer>
        </>
      )}
    </Card>
  );
};
