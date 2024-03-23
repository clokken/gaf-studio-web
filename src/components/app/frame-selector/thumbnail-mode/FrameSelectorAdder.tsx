import ImportModal from '@/components/app/importer/ImportModal';
import { ModalContext } from '@/components/ui/modal/ModalContext';
import { FRAME_SELECTOR_ITEM_HEIGHT, FRAME_SELECTOR_ITEM_WIDTH } from '@/lib/constants';
import { Icons } from '@/lib/react/icons';
import React from 'react';

export default function FrameSelectorAdder({ type }: { type: 'frames' | 'subframes' }) {
  const modal = React.useContext(ModalContext);

  // TODO reuse this by putting it higher in the tree and passing down via context maybe
  const onClickImport = React.useCallback(() => {
    const { close } = modal.pushModal({
      title: 'Import Images Wizard',
      disableBackgroundClose: true,
      body: (
        <ImportModal
          type={type}
          close={() => close()}
        />
      ),
    });
  }, [type, modal]);

  return (
    <div
      className="group shrink-0 border-2 border-gray-300 hover:border-blue-500
        cursor-pointer transition-colors"
      style={{
        width: FRAME_SELECTOR_ITEM_WIDTH,
        height: FRAME_SELECTOR_ITEM_HEIGHT,
      }}
      onClick={onClickImport}
    >
      <div className="w-full h-full flex justify-center items-center overflow-hidden">
        <Icons.Plus
          className="text-gray-400 group-hover:text-blue-500 transition-colors"
          size={24}
        />
      </div>
    </div>
  );
}
