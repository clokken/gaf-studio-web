import { ImageCompiler } from "@/lib/image/compiler/image-compiler";
import { Palette } from "@/lib/image/palette/palette";
import { PaletteUtils } from "@/lib/image/palette/palette-utils";
import { VirtualEntry, VirtualFrameDataSingleLayer, VirtualFrameDataMultiLayer, VirtualLayerData, BaseVirtualGafFrameData } from "@/lib/virtual-gaf/virtual-gaf";

export namespace RecompileGaf {
  export type Config = {
    palette: Palette;
    imageCompiler: ImageCompiler;
  };

  export function recompileVirtualGafEntries(
    config: Config,
    entries: readonly VirtualEntry<'gaf'>[],
  ): VirtualEntry<'gaf'>[] {
    return entries.map((entry) => {
      return {
        ...entry,
        frames: entry.frames.map((frame) => {
          return {
            ...frame,
            frameData: frame.frameData.kind === 'single'
              ? recompileVirtualGafFrameSingle(config, frame.frameData)
              : recompileVirtualGafFrameMulti(config, frame.frameData),
          };
        }),
      };
    });
  }

  function recompileVirtualGafFrameSingle(
    config: Config,
    frame: VirtualFrameDataSingleLayer<'gaf'>,
  ): typeof frame {
    return {
      ...frame,
      layerData: recompileVirtualLayerData(config, frame.layerData, frame),
    };
  }

  function recompileVirtualGafFrameMulti(
    config: Config,
    frame: VirtualFrameDataMultiLayer<'gaf'>,
  ):
    typeof frame
  {
    return {
      ...frame,
      layers: frame.layers.map((layer) => recompileVirtualGafFrameSingle(config, layer))
    };
  }

  function recompileVirtualLayerData(
    config: Config,
    layerData: VirtualLayerData<'gaf'>,
    { width, height, transparencyIndex }: BaseVirtualGafFrameData,
  ): typeof layerData {
    const colorData = PaletteUtils.createColorData(
      width,
      height,
      transparencyIndex,
      layerData.imageResource.paletteIndices,
      config.palette,
    );

    const recompiledImage = config.imageCompiler.compileImage(width, height, colorData);

    return {
      ...layerData,
      imageResource: {
        ...layerData.imageResource,
        compiledImage: recompiledImage,
      },
    };
  }
}
