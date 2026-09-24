import { Host } from "@/components/layout/host";
import { KoshMemberSelector } from "@/components/loan/kosh-members-selector";
import {
  Box,
  Button,
  DateRangePickerDialog,
  DateRangeSelection,
  HorizontalDivider,
  OutlinedIconButton,
  Row,
  Text,
  TextButton,
  useMaterialColors,
} from "@expo/ui/jetpack-compose";
import {
  fillMaxWidth,
  padding,
  weight,
} from "@expo/ui/jetpack-compose/modifiers";
import { dateFormatterWithSeparator } from "@kosh-app/utils/date";
import { Stack, useGlobalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

const FilterLoans = () => {
  const colors = useMaterialColors();
  const {
    id: koshId,
    memberId,
    dateFrom,
    dateTo,
  } = useGlobalSearchParams<{
    id: string;
    memberId?: string;
    dateFrom?: string;
    dateTo?: string;
  }>();

  const [date, setDate] = useState<DateRangeSelection>({
    start: dateFrom ? new Date(dateFrom) : null,
    end: dateTo ? new Date(dateTo) : null,
  });
  const [selectedMember, setSelectedMember] = useState(memberId);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const router = useRouter();

  const handleApply = () => {
    router.push({
      pathname: "/kosh/[id]/all-loans",
      params: {
        id: koshId,
        memberId: selectedMember === "all" ? undefined : selectedMember,
        dateFrom: date.start
          ? dateFormatterWithSeparator(date.start)
          : undefined,
        dateTo: date.end ? dateFormatterWithSeparator(date.end) : undefined,
      },
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: "formSheet",
          sheetAllowedDetents: [0.7, 1],
          sheetGrabberVisible: true,
          sheetCornerRadius: 24,
          sheetLargestUndimmedDetentIndex: "none",
          sheetShouldOverflowTopInset: true,
          unstable_sheetFooter: () => (
            <View className="pb-safe-offset-6 bg-background">
              <Host
                matchContents={{ vertical: true }}
                style={{ width: "100%" }}
              >
                <HorizontalDivider />
                <Row modifiers={[fillMaxWidth(), padding(16, 10, 16, 0)]}>
                  <TextButton
                    onClick={() => {
                      router.back();
                    }}
                    modifiers={[weight(1)]}
                  >
                    <Text>Close</Text>
                  </TextButton>
                  <Button onClick={() => handleApply()} modifiers={[weight(1)]}>
                    <Text>Apply</Text>
                  </Button>
                </Row>
              </Host>
            </View>
          ),
        }}
      />
      <View
        className="pt-safe-offset-14 flex-1"
        style={{ backgroundColor: colors.surface }}
      >
        <Host matchContents={{ vertical: true }}>
          <Box modifiers={[padding(16, 0, 16, 0), fillMaxWidth()]}>
            <OutlinedIconButton
              onClick={() => {
                setDatePickerVisible(true);
              }}
              modifiers={[fillMaxWidth()]}
            >
              <Text>Select Date</Text>
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
        </Host>
        <KoshMemberSelector
          memberId={selectedMember}
          onSelect={setSelectedMember}
        />
      </View>
    </>
  );
};

export default FilterLoans;
