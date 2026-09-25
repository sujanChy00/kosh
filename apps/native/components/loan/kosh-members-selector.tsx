import { trpc } from "@/utils/trpc";
import ERROR_ICON from "@expo/material-symbols/error.xml";
import { ScrollView } from "@expo/ui";
import {
  CircularProgressIndicator,
  Column,
  FilledTonalButton,
  Icon,
  RadioButton,
  Row,
  Spacer,
  Text,
  useMaterialColors,
} from "@expo/ui/jetpack-compose";
import {
  fillMaxWidth,
  height,
  padding,
  selectable,
  selectableGroup,
} from "@expo/ui/jetpack-compose/modifiers";
import type { KoshMember } from "@kosh-app/api/routers/kosh";
import { prettifyErrorMessage } from "@kosh-app/utils";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";

interface Props {
  selectedMember: { name: string | undefined; id: string | undefined };
  onSelect: (memberId: string, memberName: string) => void;
  sheetOpened: boolean;
}

export const KoshMemberSelector = ({
  selectedMember,
  onSelect,
  sheetOpened,
}: Props) => {
  const materialColors = useMaterialColors();
  const { id: koshId } = useLocalSearchParams<{
    id: string;
    memberId?: string;
  }>();

  const membersQuery = useQuery(
    trpc.kosh.members.queryOptions({ koshId }, { enabled: sheetOpened }),
  );
  const memberOptions = useMemo(
    () =>
      (membersQuery?.data?.filter((m) => !m.isNonMember) as KoshMember[]) ?? [],
    [membersQuery.data],
  );

  if (membersQuery.isPending)
    return (
      <Row
        horizontalArrangement={"center"}
        verticalAlignment="center"
        modifiers={[fillMaxWidth(), height(400)]}
      >
        <CircularProgressIndicator />
      </Row>
    );

  if (membersQuery.isError)
    return (
      <Column
        horizontalAlignment="center"
        verticalArrangement={"center"}
        modifiers={[fillMaxWidth(), height(400)]}
      >
        <Icon source={ERROR_ICON} tint={materialColors.error} size={30} />
        <Text color={materialColors.error}>
          {prettifyErrorMessage(membersQuery.error?.message) ??
            "Failed to load members"}
        </Text>
        <Spacer modifiers={[height(10)]} />
        <FilledTonalButton onClick={membersQuery.refetch}>
          <Text>Try again</Text>
        </FilledTonalButton>
      </Column>
    );

  if (memberOptions.length === 0)
    return (
      <Column
        horizontalAlignment="center"
        verticalArrangement={"center"}
        modifiers={[fillMaxWidth(), height(400)]}
      >
        <Icon source={ERROR_ICON} size={30} />
        <Text>No members found</Text>
      </Column>
    );

  return (
    <ScrollView modifiers={[fillMaxWidth()]} style={{ height: 400 }}>
      <Column modifiers={[selectableGroup()]}>
        {memberOptions.map((opt) => (
          <Row
            key={opt.id}
            verticalAlignment="center"
            modifiers={[
              fillMaxWidth(),
              height(56),
              selectable(
                opt.id === selectedMember?.id,
                () => onSelect(opt.id, opt.name),
                "radioButton",
              ),
              padding(16, 0, 16, 0),
            ]}
          >
            <RadioButton selected={opt.id === selectedMember?.id} />
            <Text modifiers={[padding(16, 0, 0, 0)]}>{opt.name}</Text>
          </Row>
        ))}
      </Column>
    </ScrollView>
  );
};
