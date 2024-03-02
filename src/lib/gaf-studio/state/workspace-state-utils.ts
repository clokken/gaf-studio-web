import { MainFormat } from '@/lib/gaf-studio/main-format';
import { CurrentGafFromFile } from '@/lib/gaf-studio/state/current-gaf';
import { WorkspaceCursor } from '@/lib/gaf-studio/state/workspace-cursor';
import { WorkspaceState, WorkspaceStateGaf, WorkspaceStateTaf } from '@/lib/gaf-studio/state/workspace-state';
import { VirtualGaf } from '@/lib/gaf-studio/virtual-gaf/virtual-gaf';
import { canvasedVirtualGafBuilder } from '@/lib/gaf-studio/virtual-gaf/virtual-gaf-conversion/canvased-virtual-gaf-builder';
import { FormatUtils } from '@/lib/utils/format-utils';
import LibGaf from 'lib-gaf';
import { DeepReadonly } from 'ts-essentials';

export namespace WorkspaceStateUtils {
  async function readGafResult(fileData: Uint8Array): Promise<LibGaf.Reader.GafReaderResult> {
    try {
      return LibGaf.Reader.readFromBuffer(fileData);
    } catch (err) {
      throw new Error(`Failed to read gaf file.`); // TODO propagate err
    }
  }

  function makeVirtualGaf(source: LibGaf.GafResult): VirtualGaf {
    // TODO pass palette from parameter ^
    const palette = undefined;
    return canvasedVirtualGafBuilder({ palette })(source);
  }

  function makeEmptyVirtualGaf(): VirtualGaf {
    return {
      entries: [],
    };
  }

  async function loadCurrentGaf(file: File): Promise<CurrentGafFromFile> {
    const fileName = file.name;
    const arrayBuffer = await file.arrayBuffer();
    const fileData = new Uint8Array(arrayBuffer);
    const gafResult = await readGafResult(fileData);

    return {
      kind: 'from-file',
      fileName,
      fileData,
      originalGaf: gafResult,
      compiledGaf: gafResult.gaf,
      virtualGaf: makeVirtualGaf(gafResult.gaf),
    };
  }

  function emptyCursor(): DeepReadonly<WorkspaceCursor> {
    return {
      entryIndex: null,
      frameIndex: null,
      subframeIndex: null,
    };
  }

  export async function initFromAnyFile(file: File): Promise<WorkspaceState> {
    const currentGaf = await loadCurrentGaf(file);

    const detectedFormat = FormatUtils.detectFormatFromResult(currentGaf.originalGaf.gaf)
      ?? FormatUtils.detectFormatFromFileName(currentGaf.fileName);

    if (detectedFormat === null) {
      throw new Error(`Could not detect format from the file provided.`);
    }

    if (detectedFormat.mainFormat === 'gaf') {
      return {
        format: 'gaf',
        currentGaf,
        currentPalette: null,
        cursor: emptyCursor(),
      };
    }

    return {
      format: 'taf',
      // currentTaf1555: detectedFormat.subFormat === 'taf_1555' ? currentGaf : null,
      // currentTaf4444: detectedFormat.subFormat === 'taf_4444' ? currentGaf : null,
      currentGafs: {
        'taf_1555': detectedFormat.subFormat === 'taf_1555' ? currentGaf : null,
        'taf_4444': detectedFormat.subFormat === 'taf_4444' ? currentGaf : null,
      },
      activeSubFormat: detectedFormat.subFormat,
      cursor: emptyCursor(),
    };
  }

  export async function initFromGafFile(file: File): Promise<WorkspaceStateGaf> {
    const currentGaf = await loadCurrentGaf(file);

    const detectedFormat = FormatUtils.detectFormatFromResult(currentGaf.originalGaf.gaf)
      ?? FormatUtils.detectFormatFromFileName(currentGaf.fileName);

    if (detectedFormat !== null && detectedFormat.mainFormat === 'taf') {
      throw new Error(`Expected a GAF, but got a TAF.`);
    }

    return {
      format: 'gaf',
      currentGaf,
      currentPalette: null,
      cursor: emptyCursor(),
    };
  }

  export async function initFromTafFile(file: File): Promise<WorkspaceStateTaf> {
    const currentGaf = await loadCurrentGaf(file);

    const detectedFormat = FormatUtils.detectFormatFromResult(currentGaf.originalGaf.gaf)
      ?? FormatUtils.detectFormatFromFileName(currentGaf.fileName);

    if (detectedFormat === null) {
      throw new Error(`Could not detect format from the file provided.`);
    }
    else if (detectedFormat.mainFormat === 'gaf') {
      throw new Error(`Expected a TAF, but got a GAF.`);
    }

    return {
      format: 'taf',
      // currentTaf1555: detectedFormat.subFormat === 'taf_1555' ? currentGaf : null,
      // currentTaf4444: detectedFormat.subFormat === 'taf_4444' ? currentGaf : null,
      currentGafs: {
        'taf_1555': detectedFormat.subFormat === 'taf_1555' ? currentGaf : null,
        'taf_4444': detectedFormat.subFormat === 'taf_4444' ? currentGaf : null,
      },
      activeSubFormat: detectedFormat.subFormat,
      cursor: emptyCursor(),
    };
  }

  export async function initFromTafPair(file1555: File, file4444: File): Promise<WorkspaceStateTaf> {
    const currentGaf1555 = await loadCurrentGaf(file1555);
    const currentGaf4444 = await loadCurrentGaf(file4444);

    const detectedFormat1555 = FormatUtils.detectFormatFromResult(currentGaf1555.originalGaf.gaf)
      ?? FormatUtils.detectFormatFromFileName(currentGaf1555.fileName);

    const detectedFormat4444 = FormatUtils.detectFormatFromResult(currentGaf4444.originalGaf.gaf)
      ?? FormatUtils.detectFormatFromFileName(currentGaf4444.fileName);

    if (detectedFormat1555?.mainFormat === 'gaf' || detectedFormat4444?.mainFormat === 'gaf') {
      throw new Error(`One of the files provided is a GAF instead of a TAF.`);
    }

    if (detectedFormat1555 === null && detectedFormat4444 === null) {
      throw new Error(`Couldn't detect the TAF subformat of any of the files provided.`);
    }

    if (detectedFormat1555 !== null && detectedFormat1555.subFormat === 'taf_4444') {
      throw new Error(`File provided as a taf_1555 is a taf_4444`);
    }

    if (detectedFormat4444 !== null && detectedFormat4444.subFormat === 'taf_1555') {
      throw new Error(`File provided as a taf_4444 is a taf_1555`);
    }

    return {
      format: 'taf',
      // currentTaf1555: currentGaf1555,
      // currentTaf4444: currentGaf4444,
      currentGafs: {
        'taf_1555': currentGaf1555,
        'taf_4444': currentGaf4444,
      },
      activeSubFormat: null,
      cursor: emptyCursor(),
    };
  }

  export function initBlank(format: 'gaf'): WorkspaceStateGaf;
  export function initBlank(format: 'taf'): WorkspaceStateTaf;
  export function initBlank(format: MainFormat): WorkspaceStateGaf | WorkspaceStateTaf {
    if (format === 'gaf') {
      return {
        format,
        currentGaf: {
          kind: 'blank',
          compiledGaf: null,
          virtualGaf: makeEmptyVirtualGaf(),
        },
        currentPalette: null,
        cursor: emptyCursor(),
      };
    }

    return {
      format,
      currentGafs: {
        'taf_1555': {
          kind: 'blank',
          compiledGaf: null,
          virtualGaf: makeEmptyVirtualGaf(),
        },
        'taf_4444': {
          kind: 'blank',
          compiledGaf: null,
          virtualGaf: makeEmptyVirtualGaf(),
        },
      },
      activeSubFormat: null,
      cursor: emptyCursor(),
    };
  }
}
