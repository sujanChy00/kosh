import FILTER_ICON from "@expo/material-symbols/filter_list.xml";
import CLEAR_FILTER_ICON from "@expo/material-symbols/format_paint.xml";
import {
  Box,
  Button,
  Column,
  DateRangePickerDialog,
  FilledTonalIconButton,
  HorizontalDivider,
  Icon,
  ModalBottomSheet,
  OutlinedIconButton,
  Row,
  Shape,
  Text,
  TextButton,
  useMaterialColors,
} from "@expo/ui/jetpack-compose";
import {
  fillMaxWidth,
  padding,
  paddingAll,
  size,
  weight,
} from "@expo/ui/jetpack-compose/modifiers";
import { useCallback, useRef, useState } from "react";

import type {
  DateRangeSelection,
  ModalBottomSheetRef,
} from "@expo/ui/jetpack-compose";
import {
  dateFormatterWithSeparator,
  formatShortDate,
} from "@kosh-app/utils/date";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";
import { FadeOut, ZoomIn } from "react-native-reanimated";
import { AnimatedView } from "../animated-view";
import { Host } from "../layout/host";
import { KoshMemberSelector } from "../loan/kosh-members-selector";

export const KoshContributionFilters = () => {
  const materialColors = useMaterialColors();
  const { memberId, dateFrom, dateTo, memberName } = useLocalSearchParams<{
    id: string;
    memberId?: string;
    memberName?: string;
    dateFrom?: string;
    dateTo?: string;
  }>();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [date, setDate] = useState<DateRangeSelection>({
    start: dateFrom ? new Date(dateFrom) : null,
    end: dateTo ? new Date(dateTo) : null,
  });
  const [selectedMember, setSelectedMember] = useState({
    name: memberName,
    id: memberId,
  });
  const sheetRef = useRef<ModalBottomSheetRef>(null);

  const hideSheet = async () => {
    await sheetRef.current?.hide();
    setVisible(false);
  };

  const handleApply = () => {
    router.setParams({
      memberId: selectedMember.id === "all" ? undefined : selectedMember.id,
      memberName:
        selectedMember.id === "all" ? undefined : selectedMember.name,
      dateFrom: date.start ? dateFormatterWithSeparator(date.start) : undefined,
      dateTo: date.end ? dateFormatterWithSeparator(date.end) : undefined,
    });
    hideSheet();
  };

  const clearFilters = useCallback(() => {
    router.setParams({
      memberId: undefined,
      memberName: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    });
  }, [router]);

  const isFiltered = !!memberId || !!dateFrom || !!dateTo;

  return (
    <View
      className="absolute bottom-safe-offset-8 right-safe-offset-4 z-30 gap-y-3"
      pointerEvents="box-none"
    >
      {isFiltered && (
        <AnimatedView
          entering={ZoomIn.duration(200)}
          exiting={FadeOut.duration(200)}
        >
          <Host matchContents>
            <Button
              contentPadding={{
                bottom: 0,
                end: 0,
                start: 0,
                top: 0,
              }}
              onClick={clearFilters}
              shape={Shape.RoundedCorner({
                cornerRadii: {
                  bottomEnd: 20,
                  bottomStart: 20,
                  topEnd: 20,
                  topStart: 20,
                },
              })}
              modifiers={[size(55, 55)]}
              colors={{
                containerColor: materialColors.errorContainer,
              }}
            >
              <Icon source={CLEAR_FILTER_ICON} tint={materialColors.error} />
            </Button>
          </Host>
        </AnimatedView>
      )}
      <Host matchContents>
        <FilledTonalIconButton
          shape={Shape.RoundedCorner({
            cornerRadii: {
              bottomEnd: 20,
              bottomStart: 20,
              topEnd: 20,
              topStart: 20,
            },
          })}
          modifiers={[size(55, 55)]}
          onClick={() => setVisible(true)}
        >
          <Icon source={FILTER_ICON} />
        </FilledTonalIconButton>

        {visible && (
          <ModalBottomSheet
            ref={sheetRef}
            onDismissRequest={() => setVisible(false)}
            skipPartiallyExpanded
          >
            <Column modifiers={[fillMaxWidth()]}>
              <Box modifiers={[paddingAll(16)]}>
                <OutlinedIconButton
                  onClick={() => {
                    setDatePickerVisible(true);
                  }}
                  modifiers={[fillMaxWidth()]}
                >
                  {date.start && date.end ? (
                    <Text>
                      {`${formatShortDate(new Date(date.start))} → ${formatShortDate(new Date(date.end))}`}
                    </Text>
                  ) : (
                    <Text>Select Date</Text>
                  )}
                </OutlinedIconButton>
              </Box>
              {datePickerVisible && (
                <DateRangePickerDialog
                  onDismissRequest={() => setDatePickerVisible(false)}
                  initialEndDate={date.end?.toISOString()}
                  initialStartDate={date.start?.toISOString()}
                  onDateRangeSelected={(range) => {
                    setDate(range);
                    setDatePickerVisible(false);
                  }}
                />
              )}
              <KoshMemberSelector
                sheetOpened={visible}
                onSelect={(id, name) => setSelectedMember({ id, name })}
                selectedMember={selectedMember}
              />
              <HorizontalDivider />
              <Row modifiers={[fillMaxWidth(), padding(16, 10, 16, 10)]}>
                <TextButton onClick={hideSheet} modifiers={[weight(1)]}>
                  <Text>Close</Text>
                </TextButton>
                <Button modifiers={[weight(1)]} onClick={handleApply}>
                  <Text>Apply</Text>
                </Button>
              </Row>
            </Column>
          </ModalBottomSheet>
        )}
      </Host>
    </View>
  );
};
