import { useLanguage } from "@/hooks/use-language";
import { useCallback, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { twMerge } from "tailwind-merge";
import { AnimatedView } from "../animated-view";
import { StyledSymbolView } from "../styled-symbol-view";
import { ThemedText } from "../themed-text";
import { SecondaryButton } from "./button";

interface SelectInputProps {
  options: { label: string; value: string; disabled?: boolean }[];
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export const SelectInput = ({
  options,
  value,
  onValueChange,
  disabled = false,
  className,
  placeholder,
}: SelectInputProps) => {
  const { t } = useLanguage();
  const [opened, setOpened] = useState(false);
  const selectedLabel = value
    ? options.find((o) => o.value === value)?.label
    : placeholder;

  const onOpen = useCallback(() => {
    setOpened(true);
  }, []);
  const onClose = useCallback(() => {
    setOpened(false);
  }, []);

  const handleOptionPress = useCallback(
    (item: { value: string }) => {
      onValueChange?.(item.value);
      onClose();
    },
    [onValueChange, onClose],
  );

  return (
    <>
      <SecondaryButton
        onPress={onOpen}
        disabled={disabled}
        className={className}
      >
        <SecondaryButton.Label className="text-foreground capitalize">
          {selectedLabel || "Select"}
        </SecondaryButton.Label>
        <StyledSymbolView
          name={{
            android: "unfold_more",
            ios: "arrow.up.and.down",
          }}
          tintColorClassName="accent-primary"
        />
      </SecondaryButton>
      <Modal
        animationType="fade"
        backdropColorClassName="accent-backdrop"
        visible={opened}
        onRequestClose={() => setOpened(false)}
      >
        <Pressable
          className="flex-1 items-center justify-end px-3 pb-safe-offset-6"
          onPress={() => setOpened(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()} className="w-full">
            <AnimatedView
              entering={FadeInDown.springify()
                .damping(22)
                .stiffness(260)
                .mass(0.9)
                .withInitialValues({ transform: [{ translateY: 60 }] })}
              exiting={FadeOutDown.duration(100)}
              className="bg-surface py-3 px-3 rounded-3xl w-full"
            >
              <ScrollView>
                {options.map((item) => {
                  const isSelected = item.value === value;
                  return (
                    <TouchableOpacity
                      onPress={() => {
                        handleOptionPress(item);
                      }}
                      key={item.value}
                      disabled={item.disabled}
                      className={twMerge(
                        "py-4",
                        item.disabled ? "opacity-50" : "",
                      )}
                    >
                      <View className="flex-row items-center gap-3 justify-between">
                        <ThemedText
                          numberOfLines={1}
                          className={twMerge(
                            "flex-1",
                            !item.disabled && isSelected
                              ? "font-notosans-semibold text-base"
                              : "font-notosans-regular text-muted-foreground",
                            item.disabled ? "text-muted" : "",
                          )}
                        >
                          {item.label}
                        </ThemedText>
                        {isSelected && (
                          <StyledSymbolView
                            name={{
                              ios: "checkmark.circle",
                              android: "check_circle",
                            }}
                            size={20}
                            tintColorClassName={"accent-foreground"}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </AnimatedView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};
