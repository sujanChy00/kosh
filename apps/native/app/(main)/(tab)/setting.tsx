import { Host } from "@/components/layout/host";
import { LegalInfo } from "@/components/setting/legal-info";
import { Preference } from "@/components/setting/preference";
import { ProfileHeader } from "@/components/setting/profile-header";
import { ProfileLinks } from "@/components/setting/profile-links";
import { Security } from "@/components/setting/security";
import { Column, List } from "@expo/ui";
import { Spacer, Surface } from "@expo/ui/jetpack-compose";
import { size } from "@expo/ui/jetpack-compose/modifiers";
import { View } from "react-native";

const SettingsScreen = () => {
  return (
    <View collapsable={false} className="flex-1">
      <Host style={{ flex: 1 }}>
        <List>
          <ProfileHeader />
          <Surface>
            <Column>
              <ProfileLinks />
              <Preference />
              <LegalInfo />
              <Security />
              <Spacer modifiers={[size(0, 20)]} />
            </Column>
          </Surface>
        </List>
      </Host>
    </View>
  );
};

export default SettingsScreen;
