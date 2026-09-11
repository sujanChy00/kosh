import { cn } from "@kosh-app/utils";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { Pressable, View } from "react-native";
import { StyledSymbolView } from "../styled-symbol-view";
import { Avatar } from "../ui/avatar";
import { OutlineButton } from "../ui/button";

interface Props {
  source: string | undefined;
  alt: string | undefined;
  className?: string;
  fallbackClassName?: string;
  onValueChange: (img: string) => void;
  imagePickerOptions?: ImagePicker.ImagePickerOptions;
}

export const ProfileImagePicker = ({
  alt,
  source,
  className,
  fallbackClassName,
  onValueChange,
  imagePickerOptions,
}: Props) => {
  const router = useRouter();
  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
      ...imagePickerOptions,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      if (asset) {
        if (asset.uri) {
          const localUri = asset.uri as string;
          onValueChange(localUri);
        }
      }
    }
  }, []);

  const takePicture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== ImagePicker.PermissionStatus.GRANTED) {
      alert("Sorry, we need camera permissions to make this work!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync();

    if (result.canceled) return;

    const uri = result.assets[0]?.uri;
    onValueChange(uri);
  };

  return (
    <View className="w-full gap-y-3 items-center">
      <Pressable
        onPress={() => {
          if (!source) return;
          router.push({
            pathname: "/image/[image]",
            params: {
              image: source,
            },
          });
        }}
      >
        <Avatar className={cn("size-24 relative overflow-auto", className)}>
          <Avatar.Image alt={alt} source={source} />
          <Avatar.Fallback
            className={cn("text-2xl", fallbackClassName)}
            source={source}
            fallback={alt ?? ""}
          />
          <View className="size-10 items-center justify-center border-4 border-background rounded-full absolute bg-surface-tertiary bottom-0 right-0">
            <StyledSymbolView
              size={16}
              name={{
                android: "edit",
                ios: "pencil",
              }}
            />
          </View>
        </Avatar>
      </Pressable>
      <View className="justify-center flex-row items-center gap-3">
        <OutlineButton onPress={takePicture}>
          <StyledSymbolView
            tintColorClassName={"accent-default-foreground"}
            name={{
              android: "photo_camera",
              ios: "camera",
            }}
            size={16}
          />
          <OutlineButton.Label>Camera</OutlineButton.Label>
        </OutlineButton>
        <OutlineButton onPress={pickImage}>
          <StyledSymbolView
            tintColorClassName={"accent-default-foreground"}
            name={{
              android: "photo_library",
              ios: "photo.on.rectangle",
            }}
            size={16}
          />
          <OutlineButton.Label>Gallery</OutlineButton.Label>
        </OutlineButton>
      </View>
    </View>
  );
};
