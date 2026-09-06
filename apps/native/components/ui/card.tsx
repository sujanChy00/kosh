import { cn } from "@kosh-app/utils";
import { TextProps } from "react-native";
import { AnimatedView, AnimatedViewProps } from "../animated-view";
import { ThemedText } from "../themed-text";

const Root = ({ style, className, ...props }: AnimatedViewProps) => (
  <AnimatedView
    style={style}
    className={cn("bg-surface rounded-3xl shadow p-3", className)}
    {...props}
  />
);
const Header = (props: AnimatedViewProps) => <AnimatedView {...props} />;
const Body = (props: AnimatedViewProps) => <AnimatedView {...props} />;
const Footer = (props: AnimatedViewProps) => <AnimatedView {...props} />;
const Title = ({ className, ...props }: TextProps) => (
  <ThemedText
    className={cn("text-lg font-medium text-foreground", className)}
    {...props}
  />
);
const Description = ({ className, ...props }: TextProps) => (
  <ThemedText className={cn("text-base text-muted", className)} {...props} />
);
export const Card = Object.assign(Root, {
  Header,
  Body,
  Footer,
  Title,
  Description,
});
