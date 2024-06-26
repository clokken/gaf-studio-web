import { FILE_MAP_VIEWER_COLORS } from '@/components/app/file-map-viewer/colors';
import { FileMapAreaGroup } from '@/lib/file-map/file-map';
import { ReadonlyUint8Array } from '@/lib/utils/utility-types';
import LibGaf from '@takingdoms/lib-gaf';
import React from 'react';
import { ElementOf } from 'ts-essentials';

type FileMapViewerAreaProps = {
  area: ElementOf<FileMapAreaGroup['areas']>;
  fileData: ReadonlyUint8Array;
  index: number;
  isAlone: boolean;
};

export default function FileMapViewerArea({
  area,
  fileData,
  index,
  isAlone,
}: FileMapViewerAreaProps) {
  const [expanded, setExpanded] = React.useState(false);

  const { label, content, offset, length } = area;

  let data: any = content;

  if (content === LibGaf.Reader.Mapping.RawBytes) {
    data = [...fileData.subarray(offset, offset + length)];
  }

  if (label === 'entry') {
    data = {
      ...content,
      name: LibGaf.Internals.BufferUtils.readString(content.name, 32),
    };
  }

  let dataStr: string;

  if (typeof data === 'number') {
    const hex = '0x' + data.toString(16).toUpperCase();
    dataStr = `${data} (${hex})`;
  }
  else if (Array.isArray(data)) {
    dataStr = JSON.stringify(data);
  }
  else {
    dataStr = JSON.stringify(data, null, 2);
  }

  const dataDiv = (
    <div
      className="bg-slate-700 text-white border border-dashed border-slate-500
        whitespace-pre-wrap px-2 py-1"
    >
      <div
        className="inline-block break-all"
        style={{ maxWidth: 250 }}
      >
        {dataStr}
      </div>
    </div>
  );

  if (isAlone) {
    return dataDiv;
  }

  const colorCls = FILE_MAP_VIEWER_COLORS[label] ?? 'bg-black border-gray-600';

  return (
    <div className={`border ${colorCls} font-mono`}>
      <div className="bg-[#FFFFFF10] px-4 py-2">
        <div className="font-medium mb-1.5">
          {label} ({index + 1})
        </div>
        <div>
          <span>{offset}</span>&nbsp;
          <span>...</span>&nbsp;
          <span>{offset + length}</span>&nbsp;
          <span>({length} bytes)</span>

          <div className="flex flex-col items-start">
            <button
              className="hover:underline mb-2"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? '[Hide data]' : '[Show data]'}
            </button>

            {expanded && dataDiv}
          </div>
        </div>
      </div>
    </div>
  );
}
