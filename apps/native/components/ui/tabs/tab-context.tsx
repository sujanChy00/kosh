import { createContext, useContext } from "react";

// --------------------------------------------------
// Root: current value + setter
interface TabsRootContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsRootContext = createContext<TabsRootContextValue | null>(null);

export const useTabs = () => {
  const ctx = useContext(TabsRootContext);
  if (!ctx) throw new Error("Tabs.* must be used within <Tabs>");
  return ctx;
};

export const TabsRootProvider = TabsRootContext.Provider;

// --------------------------------------------------
// Measurements: trigger positions/sizes, shared list config
export interface ItemMeasurements {
  width: number;
  height: number;
  x: number;
}

interface MeasurementsContextValue {
  measurements: Record<string, ItemMeasurements>;
  setMeasurements: (key: string, measurements: ItemMeasurements) => void;
  variant: "primary" | "secondary";
  isScrollView: boolean;
  setIsScrollView: (v: boolean) => void;
}

const MeasurementsContext = createContext<MeasurementsContextValue | null>(
  null,
);

export const useTabsMeasurements = () => {
  const ctx = useContext(MeasurementsContext);
  if (!ctx) throw new Error("Tabs.* must be used within <Tabs>");
  return ctx;
};

export const MeasurementsProvider = MeasurementsContext.Provider;

// --------------------------------------------------
// Trigger: per-trigger selection state, for Tabs.Label to read
interface TriggerContextValue {
  value: string;
  isSelected: boolean;
  isDisabled: boolean;
}

const TriggerContext = createContext<TriggerContextValue | null>(null);

export const useTabsTrigger = () => {
  const ctx = useContext(TriggerContext);
  if (!ctx) throw new Error("Tabs.Label must be used within Tabs.Trigger");
  return ctx;
};

export const TriggerProvider = TriggerContext.Provider;
