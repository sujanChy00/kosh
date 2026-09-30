import type { ChatListEntry } from "@kosh-app/utils";
import { useMemo } from "react";

const ITEM_SEPARATOR_HEIGHT = 10; // matches ItemSeparator's height
const ESTIMATED_HEIGHTS: Record<ChatListEntry["kind"], number> = {
  date: 32,
  message: 70, // your existing estimatedItemSize from the LegendList days
};

export const useItemLayouts = (data: ChatListEntry[]) =>
  useMemo(() => {
    const layouts: { length: number; offset: number; index: number }[] = [];
    let offset = 0;
    for (let index = 0; index < data.length; index++) {
      const length = ESTIMATED_HEIGHTS[data[index].kind];
      layouts.push({ length, offset, index });
      offset += length + ITEM_SEPARATOR_HEIGHT;
    }
    return layouts;
  }, [data]);
