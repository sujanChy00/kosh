import { Host } from "@/components/layout/host";
import { LegalInfo } from "@/components/setting/legal-info";
import { Preference } from "@/components/setting/preference";
import { ProfileLinks } from "@/components/setting/profile-links";
import { Security } from "@/components/setting/security";
import { Column, List, Spacer } from "@expo/ui";
import { View } from "react-native";

const SettingsScreen = () => {
  return (
    <View collapsable={false} className="flex-1 pt-safe-offset-14">
      <Host style={{ flex: 1 }}>
        <List>
          <Column spacing={20}>
            <ProfileLinks />
            <Preference />
            <LegalInfo />
            <Security />
          </Column>
          <Spacer size={30} />
        </List>
      </Host>
    </View>
  );
};

export default SettingsScreen;
