import { cn } from "@kosh-app/utils";
import {
  TextProps,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";
import { ThemedText } from "../themed-text";

interface ButtonProps extends TouchableOpacityProps {
  wrapperClassName?: string;
}

const SecondaryRoot = ({
  className,
  disabled = false,
  wrapperClassName,
  children,
  ...props
}: ButtonProps) => {
  return (
    <TouchableOpacity
      disabled={disabled}
      {...props}
      className={wrapperClassName}
    >
      <View
        className={cn(
          "bg-default flex-row items-center justify-center h-12 px-4 gap-2 rounded-3xl",
          disabled && "opacity-50",
          className,
        )}
      >
        {children}
      </View>
    </TouchableOpacity>
  );
};

const SecondaryLabel = ({ className, ...props }: TextProps) => {
  return (
    <ThemedText
      className={cn("text-primary font-medium", className)}
      {...props}
    />
  );
};
const PrimaryRoot = ({
  className,
  disabled = false,
  wrapperClassName,
  children,
  ...props
}: ButtonProps) => {
  return (
    <TouchableOpacity
      disabled={disabled}
      {...props}
      className={wrapperClassName}
    >
      <View
        className={cn(
          "bg-primary flex-row items-center justify-center h-12 px-4 gap-2 rounded-3xl",
          disabled && "opacity-50",
          className,
        )}
      >
        {children}
      </View>
    </TouchableOpacity>
  );
};

const PrimaryLabel = ({ className, ...props }: TextProps) => {
  return (
    <ThemedText
      className={cn("text-primary-foreground font-medium", className)}
      {...props}
    />
  );
};

const DangerRoot = ({
  className,
  disabled = false,
  wrapperClassName,
  children,
  ...props
}: ButtonProps) => {
  return (
    <TouchableOpacity
      disabled={disabled}
      {...props}
      className={wrapperClassName}
    >
      <View
        className={cn(
          "bg-danger flex-row items-center justify-center h-12 px-4 gap-2 rounded-3xl",
          disabled && "opacity-50",
          className,
        )}
      >
        {children}
      </View>
    </TouchableOpacity>
  );
};

const DangerLabel = ({ className, ...props }: TextProps) => {
  return (
    <ThemedText
      className={cn("text-danger-foreground font-medium", className)}
      {...props}
    />
  );
};
const DangerGhostRoot = ({
  className,
  disabled = false,
  wrapperClassName,
  children,
  ...props
}: ButtonProps) => {
  return (
    <TouchableOpacity
      disabled={disabled}
      {...props}
      className={wrapperClassName}
    >
      <View
        className={cn(
          "bg-transparent flex-row items-center justify-center h-12 px-4 gap-2 rounded-3xl",
          disabled && "opacity-50",
          className,
        )}
      >
        {children}
      </View>
    </TouchableOpacity>
  );
};

const DangerGhostLabel = ({ className, ...props }: TextProps) => {
  return (
    <ThemedText
      className={cn("text-danger font-medium", className)}
      {...props}
    />
  );
};
const WarningRoot = ({
  className,
  disabled = false,
  wrapperClassName,
  children,
  ...props
}: ButtonProps) => {
  return (
    <TouchableOpacity
      disabled={disabled}
      {...props}
      className={wrapperClassName}
    >
      <View
        className={cn(
          "bg-warning flex-row items-center justify-center h-12 px-4 gap-2 rounded-3xl",
          disabled && "opacity-50",
          className,
        )}
      >
        {children}
      </View>
    </TouchableOpacity>
  );
};

const WarningtLabel = ({ className, ...props }: TextProps) => {
  return (
    <ThemedText
      className={cn("text-white font-medium", className)}
      {...props}
    />
  );
};

const DangerSoftRoot = ({
  className,
  disabled = false,
  wrapperClassName,
  children,
  ...props
}: ButtonProps) => {
  return (
    <TouchableOpacity
      disabled={disabled}
      {...props}
      className={wrapperClassName}
    >
      <View
        className={cn(
          "bg-danger-soft flex-row items-center justify-center h-12 px-4 gap-2 rounded-3xl",
          disabled && "opacity-50",
          className,
        )}
      >
        {children}
      </View>
    </TouchableOpacity>
  );
};

const DangerSoftLabel = ({ className, ...props }: TextProps) => {
  return (
    <ThemedText
      className={cn("text-danger font-medium", className)}
      {...props}
    />
  );
};

const TertiaryRoot = ({
  className,
  disabled = false,
  wrapperClassName,
  children,
  ...props
}: ButtonProps) => {
  return (
    <TouchableOpacity
      disabled={disabled}
      {...props}
      className={wrapperClassName}
    >
      <View
        className={cn(
          "bg-default flex-row items-center justify-center h-12 px-4 gap-2 rounded-3xl",
          disabled && "opacity-50",
          className,
        )}
      >
        {children}
      </View>
    </TouchableOpacity>
  );
};

const TertiaryLabel = ({ className, ...props }: TextProps) => {
  return (
    <ThemedText
      className={cn("text-default-foreground font-medium", className)}
      {...props}
    />
  );
};

const GhostRoot = ({
  className,
  disabled = false,
  wrapperClassName,
  children,
  ...props
}: ButtonProps) => {
  return (
    <TouchableOpacity
      disabled={disabled}
      {...props}
      className={wrapperClassName}
    >
      <View
        className={cn(
          "bg-transparent flex-row items-center justify-center h-12 px-4 gap-2 rounded-3xl",
          disabled && "opacity-50",
          className,
        )}
      >
        {children}
      </View>
    </TouchableOpacity>
  );
};

const GhostLabel = ({ className, ...props }: TextProps) => {
  return (
    <ThemedText
      className={cn("text-primary font-medium", className)}
      {...props}
    />
  );
};

const OutlineRoot = ({
  className,
  disabled = false,
  wrapperClassName,
  children,
  ...props
}: ButtonProps) => {
  return (
    <TouchableOpacity
      disabled={disabled}
      {...props}
      className={wrapperClassName}
    >
      <View
        className={cn(
          "bg-transparent border border-border flex-row items-center justify-center h-12 px-4 gap-2 rounded-3xl",
          disabled && "opacity-50",
          className,
        )}
      >
        {children}
      </View>
    </TouchableOpacity>
  );
};

const OutlineLabel = ({ className, ...props }: TextProps) => {
  return (
    <ThemedText
      className={cn("text-default-foreground font-medium", className)}
      {...props}
    />
  );
};

export const PrimaryButton = Object.assign(PrimaryRoot, {
  Label: PrimaryLabel,
});
export const SecondaryButton = Object.assign(SecondaryRoot, {
  Label: SecondaryLabel,
});
export const TertiaryButton = Object.assign(TertiaryRoot, {
  Label: TertiaryLabel,
});
export const GhostButton = Object.assign(GhostRoot, {
  Label: GhostLabel,
});
export const OutlineButton = Object.assign(OutlineRoot, {
  Label: OutlineLabel,
});

export const DangerButton = Object.assign(DangerRoot, {
  Label: DangerLabel,
});
export const DangerSoftButton = Object.assign(DangerSoftRoot, {
  Label: DangerSoftLabel,
});

export const DangerGhostButton = Object.assign(DangerGhostRoot, {
  Label: DangerGhostLabel,
});

export const WarningButton = Object.assign(WarningRoot, {
  Label: WarningtLabel,
});
