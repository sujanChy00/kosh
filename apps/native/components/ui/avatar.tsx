import { cn, getAvatarName } from "@kosh-app/utils";
import { ImageProps } from "expo-image";
import { View, ViewProps } from "react-native";
import { AnimatedText } from "../animated-text";
import { StyledImage } from "../styled-image";

const Root = ({ className, ...rest }: ViewProps) => {
  return (
    <View
      className={cn(
        "rounded-full size-10 bg-surface-secondary items-center justify-center flex-row overflow-hidden",
        className,
      )}
      {...rest}
    />
  );
};

const AvatarImage = ({
  className,
  source,
  children,
  ...rest
}: ImageProps & { children?: React.ReactNode }) => {
  if (!!source)
    return (
      <StyledImage
        className={cn("size-full object-cover rounded-full", className)}
        source={source}
        contentFit="cover"
        {...rest}
      />
    );
  return null;
};

const AvatarFallback = ({
  className,
  source,
  fallback,
  ...rest
}: React.ComponentProps<typeof AnimatedText> & {
  source: string | null | undefined;
  fallback: string;
}) => {
  if (!!source) return null;

  return (
    <AnimatedText
      className={cn("text-foreground text-center", className)}
      {...rest}
    >
      {getAvatarName(fallback)}
    </AnimatedText>
  );
};

export const Avatar = Object.assign(Root, {
  Image: AvatarImage,
  Fallback: AvatarFallback,
});
