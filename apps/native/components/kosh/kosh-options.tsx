import { useHaptics } from "@/hooks/use-haptics";
import { errorToast, successToast } from "@/utils/toast";
import { trpc } from "@/utils/trpc";
import CHEVRON_ICON from "@expo/material-symbols/chevron_right.xml";
import DELETE_ICON from "@expo/material-symbols/delete.xml";
import EDIT_ICON from "@expo/material-symbols/edit.xml";
import INVITE_ICON from "@expo/material-symbols/group_add.xml";
import HISTORY_ICON from "@expo/material-symbols/history.xml";
import JOIN_REQUEST_ICON from "@expo/material-symbols/how_to_reg.xml";
import UPDATE_TRANSACTION_PIN_ICON from "@expo/material-symbols/lock.xml";
import MORE_ICON from "@expo/material-symbols/more_vert.xml";
import LOAN_ICON from "@expo/material-symbols/payments.xml";
import {
  CircularProgressIndicator,
  Column,
  Icon,
  IconButton,
  ModalBottomSheet,
  Row,
  Text,
  TextButton,
  useMaterialColors,
  type ModalBottomSheetRef,
} from "@expo/ui/jetpack-compose";
import {
  fillMaxWidth,
  padding,
  size,
} from "@expo/ui/jetpack-compose/modifiers";
import { KoshListItem } from "@kosh-app/api/routers/kosh";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { Host } from "../layout/host";
import { DeleteKoshAlert } from "./delete-kosh-alert";

interface KoshOptionsProps {
  koshId: string;
  role: KoshListItem["role"];
  koshName?: string;
}

export const KoshOptions = ({ koshId, role, koshName }: KoshOptionsProps) => {
  const router = useRouter();
  const materialColors = useMaterialColors();
  const haptics = useHaptics();
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const sheetRef = useRef<ModalBottomSheetRef>(null);

  const hideSheet = async () => {
    await sheetRef.current?.hide();
    setSheetVisible(false);
  };

  const openSheet = () => {
    setSheetVisible(true);
  };

  const { mutate, isPending: invitationPending } = useMutation(
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
        hideSheet();
      },
      onError: (error) => {
        haptics("error");
        errorToast({ title: error.message || "Failed to create invite" });
      },
    }),
  );

  const options = useMemo(() => {
    const list = [
      {
        title: "Edit",
        id: "edit",
        icon: EDIT_ICON,
        destructive: false,
        onClick: () => {
          router.push({
            pathname: "/kosh/[id]/edit",
            params: { id: koshId },
          });
          hideSheet();
        },
        tralingIcon: (
          <Icon source={CHEVRON_ICON} tint={materialColors.secondary} />
        ),
      },
      {
        title: "Invite",
        id: "invite",
        icon: INVITE_ICON,
        onClick: () => mutate({ koshId }),
        tralingIcon: invitationPending ? (
          <CircularProgressIndicator
            modifiers={[size(25, 25)]}
            strokeWidth={3}
          />
        ) : (
          <Icon source={CHEVRON_ICON} tint={materialColors.secondary} />
        ),
      },
      {
        title: "Join request",
        id: "join-request",
        icon: JOIN_REQUEST_ICON,
        destructive: false,
        tralingIcon: (
          <Icon source={CHEVRON_ICON} tint={materialColors.secondary} />
        ),
        onClick: () => {
          router.push({
            pathname: "/kosh/[id]/join-request",
            params: {
              id: koshId,
              role,
            },
          });
          hideSheet();
        },
      },
      {
        title: "Contribution history",
        id: "contribution-history",
        icon: HISTORY_ICON,
        destructive: false,
        tralingIcon: (
          <Icon source={CHEVRON_ICON} tint={materialColors.secondary} />
        ),
        onClick: () => {
          router.push({
            pathname: "/kosh/[id]/all-contributions",
            params: {
              id: koshId,
            },
          });
          hideSheet();
        },
      },
      {
        title: "Loans",
        id: "loans",
        icon: LOAN_ICON,
        destructive: false,
        tralingIcon: (
          <Icon source={CHEVRON_ICON} tint={materialColors.secondary} />
        ),
        onClick: () => {
          router.push({
            pathname: "/kosh/[id]/all-loans",
            params: { id: koshId },
          });
          hideSheet();
        },
      },
      {
        title: "Update pin",
        id: "update-pin",
        icon: UPDATE_TRANSACTION_PIN_ICON,
        destructive: false,
        tralingIcon: (
          <Icon source={CHEVRON_ICON} tint={materialColors.secondary} />
        ),
        onClick: () => {
          router.push({
            pathname: "/kosh/[id]/transaction-pin/update",
            params: {
              id: koshId,
            },
          });
          hideSheet();
        },
      },
    ];

    if (role === "adhyaksh") {
      list.push({
        title: "Delete",
        id: "delete",
        icon: DELETE_ICON,
        destructive: true,
        tralingIcon: <Icon source={CHEVRON_ICON} tint={materialColors.error} />,
        onClick: () => {
          setDeleteVisible(true);
          hideSheet();
        },
      });
    }

    return list;
  }, [role]);

  return (
    <Host matchContents>
      <DeleteKoshAlert
        koshId={koshId}
        koshName={koshName}
        setVisible={setDeleteVisible}
        visible={deleteVisible}
      />
      <IconButton onClick={openSheet}>
        <Icon source={MORE_ICON} tint={"#ffffff"} />
      </IconButton>
      {sheetVisible && (
        <ModalBottomSheet
          ref={sheetRef}
          onDismissRequest={() => setSheetVisible(false)}
          skipPartiallyExpanded
        >
          <Column
            modifiers={[padding(0, 0, 0, 16)]}
            verticalArrangement={{
              spacedBy: 4,
            }}
          >
            {options.map((option) => (
              <TextButton
                key={option.id}
                onClick={option.onClick}
                modifiers={[padding(16, 0, 16, 0)]}
              >
                <Row
                  modifiers={[fillMaxWidth()]}
                  verticalAlignment="center"
                  horizontalArrangement={"spaceBetween"}
                >
                  <Row
                    verticalAlignment="center"
                    horizontalArrangement={{
                      spacedBy: 10,
                    }}
                  >
                    <Icon
                      source={option.icon}
                      tint={
                        option.destructive
                          ? materialColors.error
                          : materialColors.secondary
                      }
                    />
                    <Text
                      color={
                        option.destructive
                          ? materialColors.error
                          : materialColors.secondary
                      }
                    >
                      {option.title}
                    </Text>
                  </Row>
                  {option.tralingIcon}
                </Row>
              </TextButton>
            ))}
          </Column>
        </ModalBottomSheet>
      )}
    </Host>
  );
};
