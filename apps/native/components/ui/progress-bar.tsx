import { LinearProgressIndicator } from "@expo/ui/jetpack-compose";
import { useCSSVariable } from "uniwind";
import { Host } from "../layout/host";

interface ProgressBarProps {
  progress: number;
}

export const ProgressBar = ({ progress }: ProgressBarProps) => {
  const successColor = useCSSVariable("--color-success") as string;
  return (
    <Host matchContents={{ vertical: true }}>
      <LinearProgressIndicator
        progress={progress}
        color={successColor}
        gapSize={0}
        drawStopIndicator={{
          stopSize: 0,
        }}
      />
    </Host>
  );
};
