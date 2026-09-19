import { useHaptics } from "@/hooks/use-haptics";
import { errorToast, successToast } from "@/utils/toast";
import { trpc } from "@/utils/trpc";
import DELETE_ICON from "@expo/material-symbols/delete.xml";
import EDIT_ICON from "@expo/material-symbols/edit.xml";
import INVITE_ICON from "@expo/material-symbols/group_add.xml";
import JOIN_REQUEST_ICON from "@expo/material-symbols/how_to_reg.xml";
import UPDATE_TRANSACTION_PIN_ICON from "@expo/material-symbols/lock.xml";
import { MenuView } from "@expo/ui/community/menu";
import { KoshListItem } from "@kosh-app/api/routers/kosh";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { View } from "react-native";
import { FullScreenSpinner } from "../layout/full-screen-spinner";
import { StyledSymbolView } from "../styled-symbol-view";

interface KoshOptionsProps {
  koshId: string;
  role: KoshListItem["role"];
}

export const KoshOptions = ({ koshId, role }: KoshOptionsProps) => {
  const router = useRouter();
  const haptics = useHaptics();

  const { mutate, isPending } = useMutation(
    trpc.invite.create.mutationOptions({
      onSuccess: (data) => {
        successToast({ title: "Invite created" });
        router.push({
          pathname: "/kosh/[id]/invite",
          params: {
            id: koshId,
            invitationId: data.id,
            token: data.token,
            expiresAt: data.expiresAt,
            maxUses: data.maxUses,
            useCount: data.useCount,
          },
        });
      },
      onError: (error) => {
        haptics("error");
        errorToast({ title: error.message || "Failed to create invite" });
      },
    }),
  );

  const options = useMemo(
    () => [
      {
        title: "Edit",
        id: "edit",
        image: EDIT_ICON,
      },
      {
        title: "Invite",
        id: "invite",
        image: INVITE_ICON,
      },
      {
        title: "Join request",
        id: "join-request",
        image: JOIN_REQUEST_ICON,
      },
      {
        title: "Update transaction pin",
        id: "update-transaction-pin",
        image: UPDATE_TRANSACTION_PIN_ICON,
      },
      {
        title: "Delete",
        id: "delete",
        image: DELETE_ICON,
        attributes: {
          destructive: true,
        },
      },
    ],
    [],
  );

  const onSelect = useCallback((id: string) => {
    switch (id) {
      case "edit":
        router.push({
          pathname: "/kosh/[id]/edit",
          params: { id: koshId },
        });
        break;
      case "invite":
        mutate({ koshId });
        break;
      case "join-request":
        router.push({
          pathname: "/kosh/[id]/join-request",
          params: {
            id: koshId,
            role,
          },
        });
        break;
      case "update-transaction-pin":
        router.push({
          pathname: "/kosh/[id]/update-transaction-pin",
          params: {
            id: koshId,
          },
        });
        break;
    }
  }, []);
  return (
    <>
      <MenuView
        onPressAction={(e) => {
          onSelect(e.nativeEvent.event);
        }}
        actions={options}
      >
        <View
          hitSlop={20}
          className="size-10 items-center justify-center rounded-full"
        >
          <StyledSymbolView
            tintColorClassName="accent-primary-foreground"

            name={{
              android: "more_vert",
              ios: "ellipsis",
            }}
          />
        </View>
      </MenuView>
      <FullScreenSpinner isVisible={isPending} />
    </>
  );
};
