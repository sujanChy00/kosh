import { HomeHeader } from "@/components/home/home-header";
import { KoshList } from "@/components/kosh/kosh-list";
import { StyledSymbolView } from "@/components/styled-symbol-view";
import { ThemedText } from "@/components/themed-text";
import { PrimaryButton, SecondaryButton } from "@/components/ui/button";
import { Link } from "expo-router";
import { View } from "react-native";

export default function Home() {
  return (
    <View className="flex-1 bg-background">
      {/* Header Container */}
      <View className="px-4 pt-safe pb-4 gap-y-4 bg-surface border-b border-border shadow-sm">
        <HomeHeader />

        {/* Quick Actions */}
        <View className="flex-row items-center gap-3">
          <Link href="/kosh/add" asChild>
            <PrimaryButton wrapperClassName="flex-1">
              <StyledSymbolView
                tintColorClassName="accent-primary-foreground"
                size={18}
                name={{ android: "add_circle", ios: "plus.circle" }}
              />
              <PrimaryButton.Label className="text-xs font-mono-semibold">
                New Kosh
              </PrimaryButton.Label>
            </PrimaryButton>
          </Link>

          <Link href="/kosh/join" asChild>
            <SecondaryButton wrapperClassName="flex-1">
              <StyledSymbolView
                tintColorClassName="accent-primary"
                size={18}
                name={{ android: "group_add", ios: "person.badge.plus" }}
              />
              <SecondaryButton.Label className="text-xs font-mono-semibold">
                Join Kosh
              </SecondaryButton.Label>
            </SecondaryButton>
          </Link>
        </View>
      </View>

      {/* Koshes List */}
      <View className="flex-1 px-2 pt-3">
        <View className="flex-row items-center justify-between px-2 pb-2">
          <ThemedText className="font-mono-medium text-xs uppercase text-muted-foreground">
            My Koshes
          </ThemedText>
        </View>
        <KoshList />
      </View>
    </View>
  );
}
