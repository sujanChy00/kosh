import { useAppTheme } from "@/contexts/app-theme-context";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

interface Props {
  className?: string;
  height: number;
  children: React.ReactNode;
  curveHeight?: number;
  curveFill?: string;
}

const CURVE_HEIGHT = 50;

export const CurvedBackground = ({
  className,
  height,
  children,
  curveHeight = CURVE_HEIGHT,
  curveFill,
}: Props) => {
  const { colors } = useAppTheme();
  return (
    <View className={`bg-background relative ${className}`}>
      <View
        className="bg-primary"
        style={{
          height,
        }}
      >
        {children}

        <Svg
          width="100%"
          height={curveHeight}
          viewBox="0 0 400 50"
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            bottom: -1,
            left: 0,
            right: 0,
          }}
        >
          <Path
            d="M0 0 C100 30 300 30 400 0 L400 50 L0 50 Z"
            fill={curveFill ?? colors.background}
          />
        </Svg>
      </View>
    </View>
  );
};
