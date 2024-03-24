import { MainFormat } from "@/lib/main-format";
import { WorkspaceCursor } from "@/lib/state/gaf-studio/workspace-cursor";
import { ALLOWED_FRAME_DATA_MOD_KEYS, AllowedFrameDataModification } from "@/lib/state/store/mods";
import { BaseWorkspaceSlice, SharedWorkspaceSlice } from "@/lib/state/store/workspace-slices";
import { ArrayUtils } from "@/lib/utils/array-utils";
import { ObjectUtils } from "@/lib/utils/object-utils";
import { VirtualFrame, VirtualFrameDataMultiLayer, VirtualFrameDataSingleLayer } from "@/lib/virtual-gaf/virtual-gaf";
import { Writable } from "ts-essentials";
import { StateCreator } from "zustand";

type Creator<T extends MainFormat> = StateCreator<
  BaseWorkspaceSlice<T> & SharedWorkspaceSlice<T>,
  [],
  [],
  SharedWorkspaceSlice<T>
>;

type CreatorMaker = <T extends MainFormat>() => Creator<T>;

export const createSharedSliceWrapper: CreatorMaker = () => (set, get) => ({
  setCursor: (newCursor) => set({ cursor: newCursor }),

  resetCursor: () => set({ cursor: { entryIndex: null, frameIndex: null, subframeIndex: null } }),

  getEntries: () => {
    return get().getCurrentGaf().virtualGaf.entries;
  },

  getActiveEntry: () => {
    const { entryIndex } = get().cursor;

    if (entryIndex === null) {
      return null;
    }

    const entries = get().getEntries();
    return entries[entryIndex];
  },

  getActiveFrame: () => {
    const { frameIndex } = get().cursor;

    if (frameIndex === null) {
      return null;
    }

    return get().getActiveEntry()!.frames[frameIndex];
  },

  getActiveSubframe: () => {
    const { subframeIndex } = get().cursor;

    if (subframeIndex === null) {
      return null;
    }

    const activeFrame = get().getActiveFrame()!;

    if (activeFrame.frameData.kind === 'single') {
      throw new Error(`Active frame doesn't have subframes.`);
    }

    return activeFrame.frameData.layers[subframeIndex];
  },

  setEntries: (newEntries) => {
    const currentGaf = get().getCurrentGaf();
    get().setCurrentGaf({
      ...currentGaf,
      virtualGaf:{
        ...currentGaf.virtualGaf,
        entries: newEntries,
      },
    });
  },

  setActiveEntryIndex: (entryIndex) => {
    if (entryIndex === get().cursor.entryIndex) {
      return;
    }

    const newCursor: Writable<WorkspaceCursor> = {
      entryIndex,
      frameIndex: null,
      subframeIndex: null,
    };

    if (entryIndex === null) {
      set({ cursor: newCursor });
      return;
    }

    const newEntry = get().getEntries()[entryIndex];

    if (newEntry.frames.length === 0) {
      set({ cursor: newCursor });
      return;
    }

    newCursor.frameIndex = 0;

    const newFrame = newEntry.frames[0];

    if (newFrame.frameData.kind === 'single' || newFrame.frameData.layers.length === 0) {
      set({ cursor: newCursor });
      return;
    }

    newCursor.subframeIndex = 0;

    set({ cursor: newCursor });
  },

  setActiveFrameIndex: (frameIndex) => {
    const { entryIndex } = get().cursor;

    if (entryIndex === null) {
      throw new Error(`No active entry.`);
    }

    const newCursor: Writable<WorkspaceCursor> = {
      entryIndex,
      frameIndex,
      subframeIndex: null,
    };

    if (frameIndex === null) {
      set({ cursor: newCursor });
      return;
    }

    const newEntry = get().getEntries()[entryIndex];
    const newFrame = newEntry.frames[frameIndex];

    if (newFrame.frameData.kind === 'single' || newFrame.frameData.layers.length === 0) {
      set({ cursor: newCursor });
      return;
    }

    newCursor.subframeIndex = 0;

    set({ cursor: newCursor });
  },

  setActiveSubframeIndex: (subframeIndex) => {
    const { entryIndex, frameIndex } = get().cursor;

    if (entryIndex === null) throw new Error(`No active entry.`);
    if (frameIndex === null) throw new Error(`No active frame.`);

    const newCursor: WorkspaceCursor = {
      entryIndex,
      frameIndex,
      subframeIndex,
    };

    set({ cursor: newCursor });
  },

  addFrames: (entryIndex, newFrames) => {
    const entry = get().getEntries()[entryIndex];

    const newEntry: typeof entry = {
      ...entry,
      frames: [
        ...entry.frames,
        ...newFrames,
      ],
    };

    get().replaceEntry(entryIndex, newEntry);
    get().setActiveFrameIndex(newEntry.frames.length - 1);
  },

  addFramesToActiveEntry: (newFrames) => {
    const { entryIndex } = get().cursor;
    get().addFrames(entryIndex!, newFrames);
  },

  addSubframes: (entryIndex, frameIndex, newSubframes) => {
    const frame = get().getEntries()[entryIndex].frames[frameIndex];

    if (frame.frameData.kind === 'single') {
      throw new Error(`Frame does not have subframes.`);
    }

    const newLayers = [
      ...frame.frameData.layers,
      ...newSubframes,
    ];

    const newFrame: typeof frame = {
      ...frame,
      frameData: {
        ...frame.frameData,
        layers: newLayers,
      },
    };

    get().replaceFrame(entryIndex, frameIndex, newFrame);
    get().setActiveSubframeIndex(newLayers.length - 1);
  },

  addSubframesToActiveFrame: (newSubframes) => {
    const { entryIndex, frameIndex } = get().cursor;
    get().addSubframes(entryIndex!, frameIndex!, newSubframes);
  },

  replaceEntry: (entryIndex, newEntry) => {
    const entries = get().getEntries();
    const newEntries = ArrayUtils.update(entries, entryIndex, newEntry);
    get().setEntries(newEntries);
  },

  replaceFrame: (entryIndex, frameIndex, newFrame) => {
    const entry = get().getEntries()[entryIndex];
    const newEntry: typeof entry = {
      ...entry,
      frames: ArrayUtils.update(entry.frames, frameIndex, newFrame),
    };
    get().replaceEntry(entryIndex, newEntry);
  },

  replaceSubframe: (entryIndex, frameIndex, subframeIndex, newSubframe) => {
    const entry = get().getEntries()[entryIndex];
    const frame = entry.frames[frameIndex];
    const frameData = frame.frameData;

    if (frameData.kind === 'single') {
      throw new Error(`Frame doesn't have subframes.`);
    }

    const newFrameData: typeof frameData = {
      ...frameData,
      layers: ArrayUtils.update(frameData.layers, subframeIndex, newSubframe),
    };

    const newFrame: typeof frame = {
      ...frame,
      frameData: newFrameData,
    };

    get().replaceFrame(entryIndex, frameIndex, newFrame);
  },

  modifyActiveFrameData: (mod: AllowedFrameDataModification) => {
    mod = ObjectUtils.select(mod, ALLOWED_FRAME_DATA_MOD_KEYS);
    const { entryIndex, frameIndex } = get().cursor;

    if (entryIndex === null) {
      throw new Error(`No active entry.`);
    }

    if (frameIndex === null) {
      throw new Error(`No active frame.`);
    }

    const activeEntry = get().getEntries()[entryIndex];
    const activeFrame = activeEntry.frames[frameIndex];

    const newFrame: typeof activeFrame = {
      ...activeFrame,
      frameData: {
        ...activeFrame.frameData,
        ...mod,
      },
    };

    get().replaceFrame(entryIndex, frameIndex, newFrame);
  },

  modifyActiveSubframeData: (mod) => {
    mod = ObjectUtils.select(mod, ALLOWED_FRAME_DATA_MOD_KEYS);
    const { entryIndex, frameIndex, subframeIndex } = get().cursor;

    if (subframeIndex === null) {
      throw new Error(`No active subframe.`);
    }

    const activeFrame = get().getActiveFrame()!;

    if (activeFrame.frameData.kind === 'single') {
      throw new Error(`Active frame doesn't have subframes.`);
    }

    const subframes = activeFrame.frameData.layers;
    const activeSubframe = subframes[subframeIndex];

    const newSubframe: typeof activeSubframe = {
      ...activeSubframe,
      ...mod,
    };

    get().replaceSubframe(entryIndex, frameIndex, subframeIndex, newSubframe);
  },

  convertSingleFrameToMultiFrame: (entryIndex, frameIndex) => {
    const entries = get().getEntries();
    const entry = entries[entryIndex];
    const frame = entry.frames[frameIndex];

    if (frame.frameData.kind === 'multi') {
      throw new Error(`Frame is already multi-layered.`);
    }

    const newFrameData: VirtualFrameDataMultiLayer = {
      ...frame.frameData,
      kind: 'multi',
      layers: [
        { ...frame.frameData },
      ],
    };

    const newFrame: VirtualFrame = {
      ...frame,
      frameData: newFrameData,
    };

    get().replaceFrame(entryIndex, frameIndex, newFrame);

    // auto-selects the first subframe of the new multi-layered frame (not really necessary)
    get().setCursor({ entryIndex, frameIndex, subframeIndex: 0 });
  },

  convertMultiFrameToSingleFrame: (entryIndex, frameIndex) => {
    const entries = get().getEntries();
    const entry = entries[entryIndex];
    const frame = entry.frames[frameIndex];

    if (frame.frameData.kind === 'single') {
      throw new Error(`Frame is already single-layered.`);
    }

    if (frame.frameData.layers.length !== 1) {
      throw new Error(`Frame must have exactly 1 subframe to be converted to single-layered.`);
    }

    const firstLayer = frame.frameData.layers[0];

    const newFrame: VirtualFrame = {
      ...frame,
      frameData: firstLayer,
    };

    get().replaceFrame(entryIndex, frameIndex, newFrame);

    // nullifies the subframeIndex! (very important)
    get().setCursor({ entryIndex, frameIndex, subframeIndex: null });
  },

  convertActiveFrameToMultiFrame: (ignoreIfNotNeeded) => {
    const activeFrame = get().getActiveFrame();

    if (activeFrame === null) {
      throw new Error(`No active frame.`);
    }

    const activeFrameAlreadyMulti = activeFrame.frameData.kind === 'multi';

    if (activeFrameAlreadyMulti && ignoreIfNotNeeded) {
      return false;
    }

    const { entryIndex, frameIndex } = get().cursor;
    get().convertSingleFrameToMultiFrame(entryIndex!, frameIndex!);
    return true;
  },

  convertActiveFrameToSingleFrame: (ignoreIfNotNeeded) => {
    const activeFrame = get().getActiveFrame();

    if (activeFrame === null) {
      throw new Error(`No active frame.`);
    }

    const activeFrameAlreadySingle = activeFrame.frameData.kind === 'single';

    if (activeFrameAlreadySingle && ignoreIfNotNeeded) {
      return false;
    }

    const { entryIndex, frameIndex } = get().cursor;
    get().convertMultiFrameToSingleFrame(entryIndex!, frameIndex!);
    return true;
  },

  deleteFrame: (entryIndex, frameIndex) => {
    const entries = get().getEntries();
    const entry = entries[entryIndex];

    const newFrames = [...entry.frames];
    newFrames.splice(frameIndex, 1);

    const newEntry: typeof entry = {
      ...entry,
      frames: newFrames,
    };

    get().replaceEntry(entryIndex, newEntry);

    // unselects the frame that was deleted. very important!
    get().setCursor({ entryIndex, frameIndex: null, subframeIndex: null });
  },

  deleteSubframe: (entryIndex, frameIndex, subframeIndex) => {
    const entries = get().getEntries();
    const entry = entries[entryIndex];
    const frame = entry.frames[frameIndex];

    if (frame.frameData.kind !== 'multi') {
      throw new Error(`Frame is not multi-layered.`);
    }

    const newLayers = [...frame.frameData.layers];
    newLayers.splice(subframeIndex, 1);

    const newFrame: typeof frame = {
      ...frame,
      frameData: {
        ...frame.frameData,
        layers: newLayers,
      },
    };

    get().replaceFrame(entryIndex, frameIndex, newFrame);

    // unselects the subframe that was deleted. very important!
    get().setCursor({ entryIndex, frameIndex, subframeIndex: null });
  },

  deleteActiveFrame: () => {
    const { entryIndex, frameIndex } = get().cursor;

    if (entryIndex === null) throw new Error(`No entry selected.`);
    if (frameIndex === null) throw new Error(`No frame selected`);

    get().deleteFrame(entryIndex, frameIndex);
  },

  deleteActiveSubframe: () => {
    const { entryIndex, frameIndex, subframeIndex } = get().cursor;

    if (entryIndex === null)    throw new Error(`No entry selected.`);
    if (frameIndex === null)    throw new Error(`No frame selected`);
    if (subframeIndex === null) throw new Error(`No subframe selected`);

    get().deleteSubframe(entryIndex, frameIndex, subframeIndex);
  },
});
