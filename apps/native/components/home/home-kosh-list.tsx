import type { KoshListItem } from "@kosh-app/api/routers/kosh";
import { Link } from "expo-router";
import { View } from "react-native";
import { KoshCard } from "../kosh/kosh-card";
import { KoshCardSkeleton } from "../kosh/kosh-card-skeleton";
import { StyledSymbolView } from "../styled-symbol-view";
import { ThemedText } from "../themed-text";
import { SecondaryButton } from "../ui/button";
import { Card } from "../ui/card";

type HomeKoshListProps = {
  koshList: KoshListItem[];
  isPending: boolean;
};

export const HomeKoshList = ({ koshList, isPending }: HomeKoshListProps) => {
  if (isPending)
    return (
      <Wrapper>
        <KoshCardSkeleton
          length={3}
          withSeparator
          className="overflow-hidden"
          wrapperClassName="bg-surface rounded-3xl overflow-hidden"
        />
      </Wrapper>
    );
  return (
    <Wrapper>
      <Card className="gap-y-2 p-0 overflow-hidden">
        {koshList.map((kosh, index) => (
          <KoshCard
            kosh={kosh}
            key={kosh.id}
            withSeparator
            isLast={index === koshList.length - 1}
          />
        ))}
      </Card>
    </Wrapper>
  );
};

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <View className="gap-y-2">
      <View className="flex-row items-center gap-3 justify-between">
        <ThemedText className="font-mono-medium text-xs uppercase text-muted-foreground">
          My Koshes
        </ThemedText>
        <Link
          href={{
            pathname: "/kosh",
          }}
          asChild
        >
          <SecondaryButton hitSlop={10} className="px-3 bg-transparent h-7">
            <ThemedText className="text-xs font-mono-regular text-primary">
              View All
            </ThemedText>
            <StyledSymbolView
              name={{
                android: "arrow_right_alt",
                ios: "arrow.right",
              }}
              size={16}
              tintColorClassName="accent-primary"
            />
          </SecondaryButton>
        </Link>
      </View>
      {children}
    </View>
  );
};
