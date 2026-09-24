import FILTER_ICON from "@expo/material-symbols/filter_list.xml";
import { FilledTonalIconButton, Icon, Shape } from "@expo/ui/jetpack-compose";
import { size } from "@expo/ui/jetpack-compose/modifiers";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";
import { Host } from "../layout/host";

export const KoshLoanFilters = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View
      className="absolute bottom-safe-offset-8 right-safe-offset-4 z-30"
      pointerEvents="box-none"
    >
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
          onClick={() =>
            router.push({
              pathname: "/kosh/[id]/filter-loans",
              params: {
                id,
              },
            })
          }
        >
          <Icon source={FILTER_ICON} />
        </FilledTonalIconButton>
      </Host>
    </View>
  );
};
