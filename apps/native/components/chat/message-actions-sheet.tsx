import { useMessageActionsContext } from "@/contexts/chat-thread-context";
import CONTENT_COPY_ICON from "@expo/material-symbols/content_copy.xml";
import DELETE_ICON from "@expo/material-symbols/delete.xml";
import EDIT_ICON from "@expo/material-symbols/edit.xml";
import REFRESH_ICON from "@expo/material-symbols/refresh.xml";
import REPLY_ICON from "@expo/material-symbols/reply_all.xml";
import SHARE_ICON from "@expo/material-symbols/share.xml";
import { BottomSheet } from "@expo/ui";
import {
  Column,
  HorizontalDivider,
  Icon,
  IconProps,
  Row,
  Text,
  TextButton,
  useMaterialColors,
} from "@expo/ui/jetpack-compose";
import { fillMaxWidth, paddingAll } from "@expo/ui/jetpack-compose/modifiers";
import { QUICK_REACTIONS } from "@kosh-app/utils";

export const MessageActionsSheet = () => {
  const {
    onClose,
    canShare,
    canReact,
    canCopy,
    canEdit,
    canDelete,
    isFailed,
    isOpen,
    onAction,
    onReact,
    canReply,
  } = useMessageActionsContext();

  const run = (fn: () => void) => () => {
    onClose();
    fn();
  };

  return (
    <BottomSheet
      isPresented={isOpen}
      onDismiss={onClose}
      showDragIndicator={false}
    >
      <Column>
        {canReact && (
          <Row
            verticalAlignment="center"
            horizontalArrangement={"spaceBetween"}
          >
            {QUICK_REACTIONS.map((emoji) => (
              <TextButton key={emoji} onClick={run(() => onReact(emoji))}>
                <Text>{emoji}</Text>
              </TextButton>
            ))}
          </Row>
        )}
        {canReact && <HorizontalDivider />}
        <Row
          modifiers={[paddingAll(10), fillMaxWidth()]}
          verticalAlignment="center"
          horizontalArrangement={isFailed ? "center" : "spaceBetween"}
        >
          {isFailed ? (
            <SheetRow
              label="Failed"
              icon={REFRESH_ICON}
              onPress={run(() => onAction("retry"))}
            />
          ) : (
            <>
              {canReply && (
                <SheetRow
                  label="Reply"
                  icon={REPLY_ICON}
                  onPress={run(() => onAction("reply"))}
                />
              )}
              {canCopy && (
                <SheetRow
                  label="Copy"
                  icon={CONTENT_COPY_ICON}
                  onPress={run(() => onAction("copy"))}
                />
              )}
              {canEdit && (
                <SheetRow
                  label="Edit"
                  icon={EDIT_ICON}
                  onPress={run(() => onAction("edit"))}
                />
              )}
              {canShare && (
                <SheetRow
                  label="Share"
                  icon={SHARE_ICON}
                  onPress={run(() => onAction("share"))}
                />
              )}
              {canDelete && (
                <SheetRow
                  label="Delete"
                  icon={DELETE_ICON}
                  onPress={run(() => onAction("delete"))}
                  destructive
                />
              )}
            </>
          )}
        </Row>
      </Column>
    </BottomSheet>
  );
};

function SheetRow({
  label,
  icon,
  destructive,
  onPress,
}: {
  label: string;
  icon: IconProps["source"];
  destructive?: boolean;
  onPress: () => void;
}) {
  const materialColors = useMaterialColors();

  return (
    <TextButton
      onClick={() => {
        onPress();
      }}
    >
      <Column
        horizontalAlignment="center"
        verticalArrangement={{
          spacedBy: 6,
        }}
      >
        <Icon
          tint={destructive ? materialColors.error : materialColors.tertiary}
          source={icon}
        />
        <Text
          color={destructive ? materialColors.error : materialColors.tertiary}
        >
          {label}
        </Text>
      </Column>
    </TextButton>
  );
}
