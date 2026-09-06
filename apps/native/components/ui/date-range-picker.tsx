import { useAppTheme } from "@/contexts/app-theme-context";
import {
  BottomSheetMethods,
  BottomSheetModal,
  BottomSheetView,
} from "@expo/ui/community/bottom-sheet";
import { dateFormatterWithSeparator } from "@kosh-app/utils";
import { RefObject, useState } from "react";
import { View } from "react-native";
import DateTimePicker, {
  DatePickerBaseProps,
  DateType,
  useDefaultClassNames,
} from "react-native-ui-datepicker";
import { StyledSymbolView } from "../styled-symbol-view";
import { GhostButton, OutlineButton, PrimaryButton } from "./button";

interface DateRangeType {
  endDate?: DateType;
  startDate?: DateType;
}

interface Props extends Omit<DatePickerBaseProps, "mode" | "onChange"> {
  value: DateRangeType;
  onChange: (data: DateRangeType) => void;
  bottomSheetRef: RefObject<BottomSheetMethods | null>;
}

export const DateRangePicker = ({ onChange, value, bottomSheetRef }: Props) => {
  const { isDark } = useAppTheme();
  const defaultClassNames = useDefaultClassNames();
  const [date, setDate] = useState<DateRangeType>({
    startDate: value.startDate
      ? dateFormatterWithSeparator(new Date(value.startDate as string))
      : undefined,
    endDate: value.endDate
      ? dateFormatterWithSeparator(new Date(value.endDate as string))
      : undefined,
  });

  const closeSheet = () => {
    bottomSheetRef.current?.dismiss();
  };

  return (
    <BottomSheetModal ref={bottomSheetRef} enablePanDownToClose>
      <BottomSheetView>
        <DateTimePicker
          mode="range"
          endDate={date?.endDate}
          startDate={date?.startDate}
          onChange={setDate}
          classNames={{
            ...defaultClassNames,
            selected: "bg-primary rounded-full",
            selected_label: "text-white",
            today: "bg-muted/40 rounded-full",
            today_label: "text-white",
            range_end: "bg-primary",
            range_start: "bg-primary",
            range_fill: isDark ? "bg-primary/20" : "bg-primary/10",
            range_start_label: "text-white",
            range_end_label: "text-white",
            selected_month: "bg-primary rounded-full",
            selected_month_label: "text-white",
            selected_year: "bg-primary rounded-full",
            selected_year_label: "text-white",
            range_middle_label: isDark ? "text-white" : "text-black",
            weekday_label: isDark ? "text-white" : "text-black",
          }}
          components={{
            MonthSelector: (props) => (
              <OutlineButton onPress={props.onPress} className="h-10 px-6">
                <OutlineButton.Label>{props.text}</OutlineButton.Label>
              </OutlineButton>
            ),
            YearSelector: (props) => (
              <OutlineButton onPress={props.onPress} className="h-10 px-6">
                <OutlineButton.Label>{props.year}</OutlineButton.Label>
              </OutlineButton>
            ),
            IconNext: (
              <View className="rounded-full items-center justify-center size-10">
                <StyledSymbolView
                  tintColorClassName={"accent-primary"}
                  name={{
                    ios: "chevron.right",
                    android: "chevron_right",
                  }}
                />
              </View>
            ),
            IconPrev: (
              <View className="rounded-full items-center justify-center size-10">
                <StyledSymbolView
                  tintColorClassName={"accent-primary"}
                  name={{
                    ios: "chevron.left",
                    android: "chevron_left",
                  }}
                />
              </View>
            ),
          }}
        />
        <View className="flex-row w-full items-center gap-3 px-4 justify-between pt-6 pb-3">
          <GhostButton className="flex-1" onPress={closeSheet}>
            <GhostButton.Label>Close</GhostButton.Label>
          </GhostButton>
          <PrimaryButton
            className="flex-1"
            onPress={() => {
              onChange(date);
              closeSheet();
            }}
          >
            <PrimaryButton.Label>Done</PrimaryButton.Label>
          </PrimaryButton>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
};
