import { Menu, MenuItem, MenuItemSeparator } from "@/components/ui/dropdown/DropdownMenu";
import { AdHocWizardsContext } from "@/lib/react/ad-hoc-wizards-context";
import { S } from "@/lib/state/store/store-helper";
import React from "react";

export default function FrameMenu() {
  const activeEntryIndex = S.useStore()((state) => state.cursor.entryIndex);
  const activeFrameIndex = S.useStore()((state) => state.cursor.frameIndex);
  const kind = S.useActiveFrameDataKind();

  const adHocWizards = React.useContext(AdHocWizardsContext);

  return (
    <Menu label="Frame">
      <MenuItem
        label="Add frame(s)"
        disabled={activeEntryIndex === null}
        onClick={() => adHocWizards.importImages('frames')}
      />

      <MenuItem
        label="Add subframe(s)"
        disabled={activeFrameIndex === null}
        onClick={() => adHocWizards.importImages('subframes')}
      />

      <MenuItemSeparator />

      <Menu
        label="Convert to..."
        disabled={activeFrameIndex === null}
      >
        <MenuItem
          label="Single-layered"
          disabled={kind === null || kind === 'single'}
        />

        <MenuItem
          label="Multi-layered"
          disabled={kind === null || kind === 'multi'}
        />
      </Menu>
    </Menu>
  );
}
