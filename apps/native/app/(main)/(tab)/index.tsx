import { useQuery } from "@tanstack/react-query";
import { ScrollView } from "react-native";

import { HomeHeader } from "@/components/home/home-header";
import { SelectInput } from "@/components/ui/select-input";
import { trpc } from "@/utils/trpc";
import { Shapes } from "@expo/ui/jetpack-compose/modifiers";
import { useState } from "react";

const LANGUAGES = [
  { label: "Java", value: "java" },
  { label: "JavaScript", value: "js" },
  { label: "TypeScript", value: "ts" },
];

export default function Home() {
  const [language, setLanguage] = useState("java");
  const [expanded, setExpanded] = useState(false);
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());
  const privateData = useQuery(trpc.privateData.queryOptions());
  const isConnected = healthCheck?.data === "OK";
  const isLoading = healthCheck?.isLoading;
  const shape = Shapes.RoundedCorner(16);

  return (
    <ScrollView contentContainerClassName="px-4 pt-safe-offset-14">
      <HomeHeader />
      <SelectInput
        options={LANGUAGES}
        value={language}
        onValueChange={(v) => {
          setLanguage(v);
          console.log(v);
        }}
      />
    </ScrollView>
  );
}
